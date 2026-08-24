# Table Export Utility Documentation

This utility provides reusable export functionality for tables with support for both client-side and server-side pagination.

## Features

- ✅ Export to PDF and Excel
- ✅ Support for client-side data
- ✅ Support for server-side paginated data
- ✅ Automatic column filtering (excludes action columns)
- ✅ Custom column rendering support
- ✅ Toast notifications for export status
- ✅ Reusable React component for export icons
- ✅ TypeScript-friendly

## Installation

Required packages (already included in package.json):
```bash
npm install jspdf jspdf-autotable xlsx react-hot-toast
```

## Usage

### Method 1: Using the TableExportIcons Component (Recommended)

This is the easiest way to add export functionality to your tables.

```jsx
import TableExportIcons from '@/components/TableExportIcons';

const MyTablePage = () => {
  const { shipmentOrders, columns, fetchShipmentOrders } = useShipment();

  return (
    <div className="page-header">
      <ul className="table-top-head">
        {/* Your existing icons */}
        
        {/* Add export icons */}
        <TableExportIcons
          data={shipmentOrders}
          columns={columns}
          filename="packages-export"
          title="Packages List"
        />
        
        {/* Your other icons (printer, refresh, etc.) */}
      </ul>
    </div>
  );
};
```

### Method 2: Using the Hook Directly

For more control over the export process:

```jsx
import { useTableExport } from '@/utils/tableExport';

const MyTablePage = () => {
  const { shipmentOrders, columns } = useShipment();
  
  const { exportToPDF, exportToExcel, isExporting, exportError } = useTableExport({
    data: shipmentOrders,
    columns: columns,
    filename: 'packages-export'
  });

  const handlePDFExport = async () => {
    try {
      await exportToPDF({
        title: 'Packages List',
        orientation: 'landscape'
      });
      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <button onClick={handlePDFExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export to PDF'}
    </button>
  );
};
```

### Method 3: Direct Function Calls

For one-off exports or custom implementations:

```jsx
import { exportToPDF, exportToExcel } from '@/utils/tableExport';

const handleExport = async () => {
  await exportToPDF({
    data: myData,
    columns: myColumns,
    filename: 'my-export',
    title: 'My Data Export',
    orientation: 'portrait'
  });
};
```

## Server-Side Pagination Support

For tables with server-side pagination, you need to provide a function to fetch all data:

### Example with useShipment Hook

```jsx
import TableExportIcons from '@/components/TableExportIcons';
import { createFetchAllDataFunction } from '@/utils/tableExport';

const PackagesPage = () => {
  const { 
    shipmentOrders, 
    columns, 
    fetchShipmentOrders 
  } = useShipment();

  // Create a function to fetch all data for export
  const fetchAllForExport = async () => {
    const response = await fetchShipmentOrders({
      pageNo: 1,
      pageSize: 10000, // Large page size to get all data
      searchTerm: "",
      onlyActive: false
    });
    
    return response; // Return the full dataset
  };

  return (
    <div className="page-header">
      <ul className="table-top-head">
        <TableExportIcons
          data={shipmentOrders}
          columns={columns}
          filename="all-packages"
          title="All Packages"
          fetchAllData={fetchAllForExport} // Pass the fetch function
        />
      </ul>
    </div>
  );
};
```

### Example with API Service

```jsx
import { createFetchAllDataFunction } from '@/utils/tableExport';
import { getShipmentOrders } from '@/services/shipmentService';

const PackagesPage = () => {
  // Create fetch function using the helper
  const fetchAllData = createFetchAllDataFunction(
    getShipmentOrders,
    { searchTerm: "", onlyActive: false }
  );

  return (
    <TableExportIcons
      data={currentPageData}
      columns={columns}
      filename="packages"
      title="Packages"
      fetchAllData={fetchAllData}
    />
  );
};
```

## Column Configuration

### Excluding Columns from Export

Columns are automatically filtered:
- Action columns (`dataIndex: 'action'` or `key: 'action'`) are excluded
- Columns with `exportable: false` are excluded

```jsx
const columns = [
  {
    title: "Order NO",
    dataIndex: "OrderNO",
    // This will be exported
  },
  {
    title: "Internal Notes",
    dataIndex: "notes",
    exportable: false, // This will NOT be exported
  },
  {
    title: "Action",
    dataIndex: "action",
    // Automatically excluded from export
    render: (_, record) => <ActionButtons record={record} />
  }
];
```

### Custom Column Rendering for Export

The utility will attempt to extract text from custom renders:

```jsx
const columns = [
  {
    title: "Status",
    dataIndex: "status",
    render: (text) => (
      <span className="badge bg-success">{text}</span>
    ),
    // Export will extract the text content: the status value
  },
  {
    title: "Customer",
    dataIndex: "CustomerPhone",
    render: (text, record) => (
      <div>
        <div>{record.CustomerName}</div>
        <small>{record.CustomerPhone}</small>
      </div>
    ),
    // Export will combine text: "CustomerName CustomerPhone"
  }
];
```

## Component Props Reference

### TableExportIcons Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Array | **Required** | Current table data (visible rows) |
| `columns` | Array | **Required** | Table column definitions |
| `filename` | string | 'export' | Base filename (without extension) |
| `title` | string | 'Export' | Title for PDF and Excel sheet name |
| `fetchAllData` | Function | null | Function to fetch all data for server-side pagination |
| `showPDF` | boolean | true | Show PDF export icon |
| `showExcel` | boolean | true | Show Excel export icon |
| `pdfOrientation` | string | 'landscape' | PDF orientation: 'portrait' or 'landscape' |
| `onExportStart` | Function | null | Callback when export starts `(format) => void` |
| `onExportSuccess` | Function | null | Callback on success `(format, result) => void` |
| `onExportError` | Function | null | Callback on error `(format, error) => void` |

### useTableExport Hook

```jsx
const {
  exportToPDF,      // Function to export PDF
  exportToExcel,    // Function to export Excel
  isExporting,      // Boolean: export in progress
  exportError       // String: last error message
} = useTableExport({
  data,             // Required: table data
  columns,          // Required: column definitions
  filename,         // Optional: base filename
  fetchAllData      // Optional: function to fetch all data
});
```

## Advanced Examples

### Custom Export with Callbacks

```jsx
<TableExportIcons
  data={data}
  columns={columns}
  filename="packages"
  title="Packages Report"
  onExportStart={(format) => {
    console.log(`Starting ${format} export...`);
    // Show custom loading UI
  }}
  onExportSuccess={(format, result) => {
    console.log(`Exported ${result.recordCount} records as ${format}`);
    // Log analytics event
    trackEvent('table_export', { format, count: result.recordCount });
  }}
  onExportError={(format, error) => {
    console.error(`Export failed:`, error);
    // Send error to monitoring service
    reportError(error);
  }}
/>
```

### Portrait PDF with Custom Orientation

```jsx
<TableExportIcons
  data={data}
  columns={columns}
  filename="narrow-report"
  title="Narrow Report"
  pdfOrientation="portrait"
/>
```

### Excel Only Export

```jsx
<TableExportIcons
  data={data}
  columns={columns}
  filename="data-export"
  showPDF={false}
  showExcel={true}
/>
```

## Implementation in Existing Pages

To add export functionality to an existing table page:

1. **Import the component:**
   ```jsx
   import TableExportIcons from '@/components/TableExportIcons';
   ```

2. **Add to your existing icon list:**
   ```jsx
   <ul className="table-top-head">
     {/* Your existing tooltips/icons */}
     
     <TableExportIcons
       data={yourTableData}
       columns={yourColumns}
       filename="your-export-name"
       title="Your Report Title"
     />
     
     {/* Your other icons */}
   </ul>
   ```

3. **For server-side pagination, add fetchAllData:**
   ```jsx
   const fetchAllData = async () => {
     return await yourApiCall({ pageSize: 10000 });
   };

   <TableExportIcons
     data={yourTableData}
     columns={yourColumns}
     filename="your-export-name"
     fetchAllData={fetchAllData}
   />
   ```

## Troubleshooting

### Export shows only current page data

**Problem:** When using server-side pagination, only the current page is exported.

**Solution:** Provide a `fetchAllData` function:
```jsx
const fetchAllData = async () => {
  const response = await apiCall({ pageNo: 1, pageSize: 10000 });
  return response.data;
};
```

### Column values not showing correctly

**Problem:** Complex render functions don't export properly.

**Solution:** The utility tries to extract text, but for complex cases, consider:
1. Adding a separate `exportValue` property to your column
2. Simplifying the render for export-friendly columns
3. Using dataIndex that points to the raw value

### PDF table is cut off

**Problem:** Too many columns for the page width.

**Solution:**
1. Use `landscape` orientation (default)
2. Reduce the number of exportable columns
3. Mark some columns as `exportable: false`

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE11 not supported

## Performance Considerations

- For large datasets (>1000 rows), the export may take a few seconds
- Loading toast shows progress to users
- Consider limiting exports to reasonable sizes (e.g., 10,000 records max)
- Server-side pagination requires an additional API call to fetch all data

## License

Part of the COSSIM project.
