// Run with node scripts/test-dc-ar.cjs. Exercises report interactions without a live login.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '..');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console, URLSearchParams,
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name) });
  return exports;
}

async function main() {
  for (const file of ['src/components/reports/AnalyticsReportUI.jsx', 'src/components/reports/DCARReport.jsx', 'src/components/reports/DeliveredOrdersTableReport.jsx', 'src/app/admin/(reports)/reports/completed-orders/page.jsx']) {
    const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      fileName: file, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
    });
    assert.equal((result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error).length, 0, `JSX syntax: ${file}`);
  }
  let requested;
  let apiResponse = { ResponseCode: 1, ResponseData: { Rows: [] } };
  const service = load('src/services/analyticsService.js', {
    '@/lib/apiClient': { api: { get: async url => { requested = url; return { data: apiResponse }; } } },
    '@/constants/apis': { default: { analytics: { dcAR: '/dc-ar' } }, __esModule: true },
  });
  await service.getDCARReport({ dcCode: 'A&B', startDate: '2026-10-01', vendorCode: '' });
  assert.equal(requested, '/dc-ar?dcCode=A%26B&startDate=2026-10-01');
  apiResponse = { ResponseCode: 0, ResponseMessage: 'Denied' };
  await assert.rejects(service.getDCARReport(), /Denied/);

  const state = [];
  let cursor = 0, effects = [], exported, fail = false, reportRequest;
  const headerFilters = { startDate: '2026-10-01', endDate: '2026-10-27', vendorCode: 'V', dcCodes: 'A,B' };
  const hookReact = { ...React,
    useState: initial => {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    },
    useEffect: callback => { effects.push(callback); },
    useMemo: callback => callback(), useCallback: callback => callback,
  };
  const ui = Object.fromEntries(['AnalyticsCsvButton', 'AnalyticsErrorState', 'AnalyticsField', 'AnalyticsFilterPanel',
    'AnalyticsLoadingState', 'AnalyticsMetricCard', 'AnalyticsReportHeader', 'AnalyticsSection', 'AnalyticsTable']
    .map(name => [name, Object.defineProperty(() => null, 'displayName', { value: name })]));
  const fixtures = [
    { DCCode: 'A', DCName: 'Alpha', HandedOver: 10, Delivered: 8, Paid: 4, ReturnedFailed: 1, SuccessRate: 40, AverageHours: 12, VendorCreated: 12, ReceivedKCS: 10, DispatchedDC: 10, ReceivedDC: 8, DCDelivered: 6, AttemptedThree: 3, DCReturned: 1, FailedDC: 2, ReturnedKCS: 1, AcceptedVendor: 0, Losses: 2, Recovered: 1, CODCarried: 1000 },
    { DCCode: 'B', DCName: 'Beta', HandedOver: 20, Delivered: 10, Paid: 8, ReturnedFailed: 2, SuccessRate: 40, AverageHours: null, CODCarried: 2000 },
  ];
  const utils = load('src/utils/analyticsReportUtils.js');
  const report = load('src/components/reports/DCARReport.jsx', {
    react: hookReact, 'feather-icons-react': { DollarSign: () => null, Package: () => null, Target: () => null, Truck: () => null },
    '@/services/analyticsService': { getDCARReport: async params => {
      reportRequest = params;
      if (fail) throw new Error('Network unavailable');
      // camelCase is also accepted from API serializers.
      return { rows: fixtures, summary: { handedOver: 30, delivered: 18, paid: 12, successRate: 40, codCarried: 3000 } };
    } },
    '@/contexts/GlobalFiltersContext': { useGlobalFilters: () => ({ filters: headerFilters }) },
    '@/components/reports/AnalyticsReportUI': ui,
    '@/utils/analyticsReportUtils': { ...utils, downloadReportCsv: (...args) => { exported = args; } },
    '@/style/css/analytics-reports.css': {},
  }).default;
  let tree;
  function render() { cursor = 0; effects = []; tree = report(); return tree; }
  function elements(node) {
    if (Array.isArray(node)) return node.flatMap(elements);
    if (!React.isValidElement(node)) return [];
    return [node, ...elements(node.props.children), ...elements(node.props.action)];
  }
  const find = type => elements(tree).find(node => node.type === type);
  render();
  assert.ok(find(ui.AnalyticsLoadingState));
  effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  render();
  let table = find(ui.AnalyticsTable);
  assert.equal(table.props.rows[0].DCCode, 'B', 'default ordering should show largest handover cohort first');
  table.props.columns.find(column => column.key === 'DCName').label.props.onClick();
  render();
  assert.equal(find(ui.AnalyticsTable).props.rows[0].DCCode, 'A');

  elements(tree).find(node => node.props['aria-label'] === 'Search distribution centres').props.onChange({ target: { value: 'alpha' } });
  render();
  assert.equal(find(ui.AnalyticsTable).props.rows.length, 1);
  find(ui.AnalyticsCsvButton).props.onClick();
  assert.equal(exported[2].length, 1);
  assert.equal(exported[1].find(column => column.key === 'AwaitingKCS').value(exported[2][0]), 2);
  assert.equal(find(ui.AnalyticsReportHeader).props.title, 'CS KPI');
  const expected = { dispatch: [['AwaitingKCS', 2], ['AwaitingDC', 2]], cx: [['UndeliveredDC', 2], ['BelowThree', 5]], reverse: [['AwaitingReturnKCS', 1], ['AwaitingAcceptance', 1]], finance: [['Uncompleted', 4], ['Unrecovered', 1]], pus: [['PUSUndelivered', 2], ['PUSOutstanding', 1]] };
  for (const [key, measures] of Object.entries(expected)) {
    find(ui.AnalyticsReportHeader).props.reportTabs.find(tab => tab.key === key).props.onClick();
    render();
    find(ui.AnalyticsCsvButton).props.onClick();
    for (const [metric, value] of measures) {
      assert.equal(exported[1].find(column => column.key === metric).value(exported[2][0]), value, `${key}: ${metric}`);
    }
  }
  assert.equal(reportRequest.dcCode, 'A,B');
  assert.equal(reportRequest.vendorCode, 'V');
  assert.equal(reportRequest.startDate, '2026-10-01');
  assert.ok(!find(ui.AnalyticsFilterPanel), 'Local filter panel must be removed');
  headerFilters.dcCodes = '__NONE__';
  render(); effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reportRequest.dcCode, '__NONE__');
  headerFilters.startDate = '2099-01-01';
  render();
  effects[0]();
  render();
  assert.match(find(ui.AnalyticsErrorState).props.message, /Start date/);
  headerFilters.startDate = '2026-10-01';
  render();
  fail = true;
  effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  render();
  assert.equal(find(ui.AnalyticsErrorState).props.message, 'Network unavailable');
  console.log('PASS: API query encoding/errors, loading, response casing, sorting, search, five KPI tabs, ten calculations, CSV values, date validation and request failure.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
