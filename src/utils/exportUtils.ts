/**
 * Export Utilities for CSV and PDF Report Generation
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SummaryMetric {
  label: string;
  value: string;
}

export interface ExportDataOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summaryMetrics?: SummaryMetric[];
  companyName?: string;
}

/**
 * Downloads tabular data as an Excel-compatible CSV file with UTF-8 BOM
 */
export function exportToCSV(options: ExportDataOptions): void {
  const { title, headers, rows, filename, summaryMetrics } = options;

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel

  // Header meta
  csvContent += `"${title.replace(/"/g, '""')}"\r\n`;
  csvContent += `"Generated on: ${new Date().toLocaleString()}"\r\n\r\n`;

  // Summary Metrics if any
  if (summaryMetrics && summaryMetrics.length > 0) {
    csvContent += `"SUMMARY METRICS"\r\n`;
    summaryMetrics.forEach((m) => {
      csvContent += `"${m.label.replace(/"/g, '""')}","${String(m.value).replace(/"/g, '""')}"\r\n`;
    });
    csvContent += `\r\n`;
  }

  // Column Headers
  csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

  // Data rows
  rows.forEach((row) => {
    const rowStr = row
      .map((val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
    csvContent += rowStr + '\r\n';
  });

  // Mandatory Time of Print / Export at the bottom
  const exportTimestamp = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  csvContent += `\r\n"Time of Print / Export: ${exportTimestamp}"\r\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.endsWith('.csv') ? filename : `${filename}.csv`}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, styled PDF document with tables and header branding
 */
export function exportToPDF(options: ExportDataOptions): void {
  const {
    title,
    subtitle = 'SEENU CARE ERP - Comprehensive Report',
    filename,
    headers,
    rows,
    summaryMetrics = [],
    companyName = 'SEENU CARE CO. - BEAUTY & SALON WHOLESALE',
  } = options;

  // Create A4 Landscape or Portrait based on column count
  const isLandscape = headers.length > 6;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Header Banner
  doc.setFillColor(88, 28, 135); // Deep Purple #581c87
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 10);

  // Subtitle / Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()} | Tax-Free Jurisdiction`, 14, 17);

  // Report Title
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 35);

  let currentY = 40;

  // Summary Metrics Section (Bento-style small boxes)
  if (summaryMetrics.length > 0) {
    const boxWidth = Math.min(60, (pageWidth - 28) / summaryMetrics.length);
    summaryMetrics.forEach((metric, index) => {
      const x = 14 + index * (boxWidth + 4);
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.roundedRect(x, currentY, boxWidth, 14, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(metric.label.toUpperCase(), x + 3, currentY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(metric.value), x + 3, currentY + 10.5);
    });
    currentY += 19;
  }

  // AutoTable for Tabular Data
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 29, 149], // Purple 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbers & Time of Print/Export
      const pageCount = doc.getNumberOfPages();
      const printTimestamp = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Time of Print / Export: ${printTimestamp} | Page ${data.pageNumber} of ${pageCount} — SEENU CARE ERP`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    },
  });

  doc.save(`${filename.endsWith('.pdf') ? filename : `${filename}.pdf`}`);
}
