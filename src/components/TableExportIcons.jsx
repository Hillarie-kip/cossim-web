"use client";

import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Link from '@/components/Link';
import ImageWithBasePath from '@/core/img/imagewithbasebath';
import { exportToPDF, exportToExcel } from '@/utils/tableExport';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * TableExportIcons Component
 * Reusable export icons for tables with PDF and Excel export functionality
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Table data to export (current visible data)
 * @param {Array} props.columns - Table column definitions (fallback for both PDF and Excel)
 * @param {Array} props.pdfColumns - Specific columns for PDF export (optional)
 * @param {Array} props.excelColumns - Specific columns for Excel export (optional)
 * @param {string} props.filename - Base filename for exports (without extension)
 * @param {string} props.title - Title for PDF export
 * @param {Function} props.fetchAllData - Optional function to fetch all data for server-side pagination
 * @param {boolean} props.showPDF - Show PDF export icon (default: true)
 * @param {boolean} props.showExcel - Show Excel export icon (default: true)
 * @param {string} props.pdfOrientation - PDF orientation: 'portrait' or 'landscape' (default: 'landscape')
 * @param {Function} props.onExportStart - Callback when export starts
 * @param {Function} props.onExportSuccess - Callback when export succeeds
 * @param {Function} props.onExportError - Callback when export fails
 */
const ExportProgressToast = ({ label, current, total }) => {
  const pct = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div style={{ minWidth: 200 }}>
      <div className="mb-1">{label}{total ? ` (${current}/${total})` : '...'}</div>
      {total > 0 && (
        <div style={{ height: 5, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: '#ff6200',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      )}
    </div>
  );
};

const TableExportIcons = ({
  data,
  columns,
  pdfColumns,
  excelColumns,
  filename = 'export',
  title = 'Export',
  fetchAllData = null,
  showPDF = true,
  showExcel = true,
  pdfOrientation = 'landscape',
  onExportStart,
  onExportSuccess,
  onExportError,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const { user } = useAuth();

  const handleExportPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    onExportStart?.('pdf');

    const toastId = 'export-pdf-progress';
    toast.loading(<ExportProgressToast label="Fetching records" current={0} total={0} />, { id: toastId });

    try {
      const result = await exportToPDF({
        data,
        columns: pdfColumns || columns,
        filename,
        title,
        orientation: pdfOrientation,
        fetchAllData,
        onProgress: (current, total) => {
          toast.loading(<ExportProgressToast label="Fetching records" current={current} total={total} />, { id: toastId });
        },
        user,
      });

      toast.dismiss(toastId);
      toast.success(`PDF exported successfully! (${result.recordCount} records)`);
      onExportSuccess?.('pdf', result);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.dismiss(toastId);
      toast.error(`Failed to export PDF: ${error.message}`);
      onExportError?.('pdf', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;

    setIsExporting(true);
    onExportStart?.('excel');

    const toastId = 'export-excel-progress';
    toast.loading(<ExportProgressToast label="Fetching records" current={0} total={0} />, { id: toastId });

    try {
      const result = await exportToExcel({
        data,
        columns: excelColumns || columns,
        filename,
        sheetName: title,
        fetchAllData,
        onProgress: (current, total) => {
          toast.loading(<ExportProgressToast label="Fetching records" current={current} total={total} />, { id: toastId });
        },
      });

      toast.dismiss(toastId);
      toast.success(`Excel exported successfully! (${result.recordCount} records)`);
      onExportSuccess?.('excel', result);
    } catch (error) {
      console.error('Excel Export Error:', error);
      toast.dismiss(toastId);
      toast.error(`Failed to export Excel: ${error.message}`);
      onExportError?.('excel', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderTooltip = (text) => (props) => (
    <Tooltip id={`${text.toLowerCase()}-tooltip`} {...props}>
      {text}
    </Tooltip>
  );

  return (
    <>
      {showPDF && (
        <li>
          <OverlayTrigger placement="top" overlay={renderTooltip('Export to PDF')}>
            <Link
              onClick={handleExportPDF}
              style={{ 
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.6 : 1
              }}
            >
              <ImageWithBasePath 
                src="assets/img/icons/pdf.svg" 
                alt="Export to PDF" 
              />
            </Link>
          </OverlayTrigger>
        </li>
      )}
      
      {showExcel && (
        <li>
          <OverlayTrigger placement="top" overlay={renderTooltip('Export to Excel')}>
            <Link
              onClick={handleExportExcel}
              style={{ 
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.6 : 1
              }}
            >
              <ImageWithBasePath
                src="assets/img/icons/excel.svg"
                alt="Export to Excel"
              />
            </Link>
          </OverlayTrigger>
        </li>
      )}
    </>
  );
};

export default TableExportIcons;
