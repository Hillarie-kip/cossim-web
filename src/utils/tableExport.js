/**
 * Table Export Utility
 * Supports exporting table data to PDF and Excel formats
 * Works with both client-side and server-side paginated tables
 */

import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Extract text from React element children recursively
 * @param {any} children - React element children
 * @returns {string} Extracted text
 */
const extractTextFromChildren = (children) => {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  
  if (Array.isArray(children)) {
    return children.map(child => extractTextFromChildren(child)).join(' ').trim();
  }
  
  // Handle React elements
  if (children && typeof children === 'object' && children.props) {
    return extractTextFromChildren(children.props.children);
  }
  
  return '';
};

/**
 * Format cell value for export
 * @param {any} value - The cell value to format
 * @param {Function} render - Optional render function from column definition
 * @returns {string} Formatted value
 */
const formatCellValue = (value, render) => {
  if (value === null || value === undefined) return '';
  
  // If there's a custom render function, try to extract text from it
  if (render && typeof render === 'function') {
    const rendered = render(value);
    
    // Handle React elements - try to extract text content
    if (rendered && typeof rendered === 'object') {
      // For simple text nodes
      if (rendered.props?.children) {
        return extractTextFromChildren(rendered.props.children);
      }
      return String(value);
    }
    
    return String(rendered);
  }
  
  // Handle dates
  if (value instanceof Date) {
    return value.toLocaleDateString() + ' ' + value.toLocaleTimeString();
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

/**
 * Extract exportable columns from table column definitions
 * @param {Array} columns - Table column definitions
 * @returns {Array} Filtered columns suitable for export
 */
const getExportableColumns = (columns) => {
  return columns.filter(col => {
    // Exclude action columns and columns marked as non-exportable
    if (col.dataIndex === 'action' || col.key === 'action') return false;
    if (col.exportable === false) return false;
    return true;
  });
};

/**
 * Prepare data for export
 * @param {Array} data - Table data
 * @param {Array} columns - Table column definitions
 * @returns {Array} Processed data ready for export
 */
const prepareDataForExport = (data, columns) => {
  const exportableColumns = getExportableColumns(columns);
  
  return data.map(record => {
    const row = {};
    for (const col of exportableColumns) {
      const value = record[col.dataIndex || col.key];
      row[col.title] = formatCellValue(value, col.render ? 
        (val) => col.render(val, record) : null);
    }
    return row;
  });
};

/**
 * Export table data to PDF
 * @param {Object} options - Export options
 * @param {Array} options.data - Table data to export
 * @param {Array} options.columns - Table column definitions
 * @param {string} options.filename - Output filename (without extension)
 * @param {string} options.title - PDF document title
 * @param {Object} options.orientation - PDF orientation ('portrait' or 'landscape')
 * @param {Function} options.fetchAllData - Optional function to fetch all data for server-side pagination
 * @param {Object} options.user - Authenticated user object with name/email
 */
export const exportToPDF = async ({
  data,
  columns,
  filename = 'table-export',
  title = 'Table Export',
  orientation = 'landscape',
  fetchAllData = null,
  onProgress = null,
  user = null
}) => {
  try {
    // If fetchAllData is provided (server-side pagination), fetch all data.
    // fetchAllData may accept an onProgress(current, total) callback for
    // implementations that fetch in batches instead of one large request.
    let exportData = data;
    if (fetchAllData && typeof fetchAllData === 'function') {
      exportData = await fetchAllData(onProgress);
    }

    // Validate exportData is an array
    if (!Array.isArray(exportData)) {
      console.error('Export data is not an array:', exportData);
      throw new Error('Export data must be an array. Received: ' + typeof exportData);
    }

    if (exportData.length === 0) {
      throw new Error('No data available to export');
    }

    const exportableColumns = getExportableColumns(columns);
    const processedData = prepareDataForExport(exportData, columns);
    
    // Initialize PDF
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add header - Company Name with theme color
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 98, 0); // #FF6200 - Orange theme color
    const companyName = 'Cossim Limited';
    const companyNameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - companyNameWidth) / 2, 12); // Centered
    
    // Add a line under the header with orange theme
    doc.setDrawColor(255, 98, 0); // #FF6200
    doc.setLineWidth(0.8);
    doc.line(14, 15, pageWidth - 14, 15);
    
    // Add title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(16, 17, 19); // #101113 - Dark theme color
    doc.text(title, 14, 23);
    
    // Add metadata
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(16, 17, 19); // #101113
    const exportDate = new Date().toLocaleString();
    doc.text(`Exported: ${exportDate}`, 14, 30);
    doc.text(`Total Records: ${exportData.length}`, 14, 35);
    
    // Prepare table headers
    const headers = exportableColumns.map(col => col.title);
    
    // Prepare table body
    const body = processedData.map(row => 
      exportableColumns.map(col => row[col.title] || '')
    );
    
    // Generate table using autoTable
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [16, 17, 19], // #101113 - Dark text
      },
      headStyles: {
        fillColor: [255, 98, 0], // #FF6200 - Orange header background
        textColor: [255, 255, 255], // White text on orange background
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250], // Light gray for alternate rows
      },
      margin: { top: 40, bottom: 20 },
      didDrawPage: (data) => {
        // Footer - Generated by text with user name
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(255, 98, 0); // #FF6200 - Orange theme color for footer
        
        // Get user name from user object (name, fullName, firstName + lastName, or email)
        const userName = `${user?.FirstName} ${user?.LastName}`.trim() || user?.Email || 'User';
        
        const footerText = `Generated by ${userName} | Cossim Limited | ${new Date().toLocaleDateString()}`;
        const footerWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10); // Centered at bottom
        
        // Reset text color for next page
        doc.setTextColor(0, 0, 0);
      }
    });
    
    // Save PDF
    doc.save(`${filename}.pdf`);
    
    return { success: true, recordCount: exportData.length };
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

/**
 * Export table data to Excel
 * @param {Object} options - Export options
 * @param {Array} options.data - Table data to export
 * @param {Array} options.columns - Table column definitions
 * @param {string} options.filename - Output filename (without extension)
 * @param {string} options.sheetName - Excel sheet name
 * @param {Function} options.fetchAllData - Optional function to fetch all data for server-side pagination
 */
export const exportToExcel = async ({
  data,
  columns,
  filename = 'table-export',
  sheetName = 'Sheet1',
  fetchAllData = null,
  onProgress = null
}) => {
  try {
    // If fetchAllData is provided (server-side pagination), fetch all data.
    // fetchAllData may accept an onProgress(current, total) callback for
    // implementations that fetch in batches instead of one large request.
    let exportData = data;
    if (fetchAllData && typeof fetchAllData === 'function') {
      exportData = await fetchAllData(onProgress);
    }

    // Validate exportData is an array
    if (!Array.isArray(exportData)) {
      console.error('Export data is not an array:', exportData);
      throw new Error('Export data must be an array. Received: ' + typeof exportData);
    }

    if (exportData.length === 0) {
      throw new Error('No data available to export');
    }

    const processedData = prepareDataForExport(exportData, columns);
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    
    // Set column widths
    const exportableColumns = getExportableColumns(columns);
    const columnWidths = exportableColumns.map(col => ({
      wch: Math.max(col.title.length + 5, 15)
    }));
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Add metadata
    workbook.Props = {
      Title: filename,
      Subject: 'Table Export',
      Author: 'Cossim',
      CreatedDate: new Date()
    };
    
    // Save Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return { success: true, recordCount: exportData.length };
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw new Error(`Failed to export Excel: ${error.message}`);
  }
};

/**
 * Hook for table export functionality
 * @param {Object} options - Hook options
 * @param {Array} options.data - Current table data (visible rows)
 * @param {Array} options.columns - Table column definitions
 * @param {string} options.filename - Base filename for exports
 * @param {Function} options.fetchAllData - Optional function to fetch all data for server-side pagination
 * @returns {Object} Export functions and state
 */
export const useTableExport = ({
  data,
  columns,
  filename = 'export',
  fetchAllData = null
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState(null);

  const handleExportPDF = async (customOptions = {}) => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const result = await exportToPDF({
        data,
        columns,
        filename,
        fetchAllData,
        ...customOptions
      });
      
      return result;
    } catch (error) {
      setExportError(error.message);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async (customOptions = {}) => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const result = await exportToExcel({
        data,
        columns,
        filename,
        fetchAllData,
        ...customOptions
      });
      
      return result;
    } catch (error) {
      setExportError(error.message);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF: handleExportPDF,
    exportToExcel: handleExportExcel,
    isExporting,
    exportError
  };
};

/**
 * Create a fetch function for server-side paginated data that fetches in
 * small batches instead of requesting everything in one large page. This
 * avoids overwhelming the server with a single huge `pageSize` request and
 * allows reporting fetch progress back to the caller.
 *
 * @param {Function} apiCall - API function to call, e.g. fetchShipmentOrders
 * @param {Object} baseParams - Base query params (filters, search, etc.) excluding pageNo/pageSize
 * @param {Object} [options]
 * @param {number} [options.chunkSize=500] - Number of records to request per batch
 * @param {Function} [options.getTotalCount] - Extracts the total record count from a response (default: response.TotalCount)
 * @param {Function} [options.getData] - Extracts the records array from a response (default: response.Data || response.data || response.items)
 * @returns {Function} Function `(onProgress) => Promise<Array>` that fetches all data in batches,
 *   calling `onProgress(fetchedCount, totalCount)` after each batch
 */
export const createFetchAllDataFunction = (apiCall, baseParams = {}, options = {}) => {
  const {
    chunkSize = 500,
    getTotalCount = (response) => response?.TotalCount || 0,
    getData = (response) => response?.Data || response?.data || response?.items || [],
  } = options;

  return async (onProgress) => {
    try {
      // First, make a cheap request to discover the total record count
      const countResponse = await apiCall({ ...baseParams, pageNo: 1, pageSize: 1 });
      const totalCount = getTotalCount(countResponse) || 0;

      if (totalCount === 0) return [];

      const totalPages = Math.ceil(totalCount / chunkSize);
      let allRecords = [];

      for (let page = 1; page <= totalPages; page++) {
        const response = await apiCall({ ...baseParams, pageNo: page, pageSize: chunkSize });
        allRecords = allRecords.concat(getData(response));
        onProgress?.(allRecords.length, totalCount);
      }

      return allRecords;
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      throw error;
    }
  };
};

const tableExportUtils = {
  exportToPDF,
  exportToExcel,
  useTableExport,
  createFetchAllDataFunction
};

export default tableExportUtils;
