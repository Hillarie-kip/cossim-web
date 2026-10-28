import jsPDF from 'jspdf';

export const createStickerPdf = (pageWidth, pageHeight) => new jsPDF({
  orientation: 'portrait',
  unit: 'pt',
  format: [pageWidth, pageHeight],
  compress: true,
});

export const appendStickerCanvas = (pdf, canvas, pageWidth, pageHeight) => {
  try {
    // Explicit lossless compression also compresses PNG alpha streams. Without
    // it, high-resolution labels accumulate hundreds of MB before output().
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  } finally {
    // Release the pixel buffer immediately instead of waiting for browser GC.
    canvas.width = 0;
    canvas.height = 0;
  }
};
