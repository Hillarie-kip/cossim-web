// Regression for jsPDF Array.join / Invalid string length above 40 stickers.
// Run: node scripts/test-bulk-sticker-pdf.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { PNG } = require('pngjs');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/stickerPdf.js'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, esModuleInterop: true,
} }).outputText;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject, require });
const { createStickerPdf, appendStickerCanvas } = exportsObject;

const width = 1440, height = 1920; // Actual medium label at existing 4x resolution.
const image = new PNG({ width, height });
image.data.fill(255);
// High-contrast text-like lines and barcode strips, with an opaque alpha channel.
for (let y = 30; y < height - 30; y++) {
  for (let x = 30; x < width - 30; x++) {
    if ((y < 120) || (y % 100 < 6) || (y > height - 300 && x % 17 < 6)) {
      const offset = (y * width + x) * 4;
      image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = 0;
    }
  }
}
const pdf = createStickerPdf(216, 288);
for (let i = 0; i < 60; i++) {
  // Distinct input per page prevents image-cache reuse hiding the memory issue.
  image.data[(150 * width + 100) * 4] = i;
  const encoded = PNG.sync.write(image).toString('base64');
  const canvas = { width, height, toDataURL: () => `data:image/png;base64,${encoded}` };
  if (i) pdf.addPage([216, 288], 'portrait');
  appendStickerCanvas(pdf, canvas, 216, 288);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
}
assert.equal(pdf.getNumberOfPages(), 60);
assert.equal(Object.keys(pdf.internal.collections.addImage_images).length, 60);
const blob = pdf.output('blob');
assert.ok(blob && blob.size > 0, 'Bulk output must produce a PDF blob');
assert.ok(blob.size < 20 * 1024 * 1024, `Expected compressed output, got ${blob.size} bytes`);
const failedCanvas = { width: 100, height: 100, toDataURL: () => 'unused' };
assert.throws(() => appendStickerCanvas({ addImage() { throw new Error('image failure'); } }, failedCanvas, 216, 288), /image failure/);
assert.equal(failedCanvas.width, 0);
assert.equal(failedCanvas.height, 0);
console.log(`PASS: 60 distinct high-resolution stickers serialized to a ${(blob.size / 1024 / 1024).toFixed(2)} MB PDF; all canvases released, including on failure.`);
