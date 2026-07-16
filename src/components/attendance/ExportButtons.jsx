import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportButtons({ 
  data, 
  columns, 
  summary, 
  title = "Attendance Report",
  studentInfo = null 
}) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const generatePDF = async () => {
    setExportingPdf(true);
    
    // Create HTML content for PDF
    let htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
          .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
          .header h2 { color: #475569; margin: 10px 0 0 0; font-size: 18px; }
          .header p { color: #64748b; margin: 5px 0 0 0; }
          .student-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .student-info p { margin: 5px 0; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1e40af; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          tr:nth-child(even) { background: #f8fafc; }
          .summary { margin-top: 30px; background: #f1f5f9; padding: 20px; border-radius: 8px; }
          .summary h3 { margin: 0 0 15px 0; color: #1e40af; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-item .value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .summary-item .label { font-size: 12px; color: #64748b; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .footer p { color: #64748b; font-size: 11px; margin: 5px 0; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-line { width: 200px; border-top: 1px solid #334155; padding-top: 5px; text-align: center; font-size: 12px; color: #475569; }
          .present { color: #059669; }
          .absent { color: #dc2626; }
          .holiday { color: #d97706; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Government Polytechnic College</h1>
          <h2>Smart Attendance System</h2>
          <p>${title}</p>
        </div>
    `;

    if (studentInfo) {
      htmlContent += `
        <div class="student-info">
          <p><strong>Enrollment No:</strong> ${studentInfo.enrollment}</p>
          <p><strong>Name:</strong> ${studentInfo.name}</p>
        </div>
      `;
    }

    htmlContent += `<table><thead><tr>`;
    columns.forEach(col => {
      htmlContent += `<th>${col.header}</th>`;
    });
    htmlContent += `</tr></thead><tbody>`;

    data.forEach(row => {
      htmlContent += `<tr>`;
      columns.forEach(col => {
        let value = row[col.key] || '-';
        let className = '';
        if (col.key === 'status') {
          className = value.toLowerCase();
          value = value.charAt(0).toUpperCase() + value.slice(1);
        }
        htmlContent += `<td class="${className}">${value}</td>`;
      });
      htmlContent += `</tr>`;
    });

    htmlContent += `</tbody></table>`;

    if (summary) {
      htmlContent += `
        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="value">${summary.workingDays}</div>
              <div class="label">Working Days</div>
            </div>
            <div class="summary-item">
              <div class="value" style="color: #059669;">${summary.presentDays}</div>
              <div class="label">Present Days</div>
            </div>
            <div class="summary-item">
              <div class="value" style="color: #dc2626;">${summary.absentDays}</div>
              <div class="label">Absent Days</div>
            </div>
            <div class="summary-item">
              <div class="value">${summary.percentage.toFixed(1)}%</div>
              <div class="label">Attendance</div>
            </div>
          </div>
        </div>
      `;
    }

    htmlContent += `
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString('en-IN', { 
            day: '2-digit', month: 'long', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
          })}</p>
        </div>
        <div class="signature">
          <div class="signature-line">Student Signature</div>
          <div class="signature-line">Teacher Signature</div>
        </div>
      </body>
      </html>
    `;

    // Create and download PDF using print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      setExportingPdf(false);
      toast.success('PDF generated successfully');
    }, 500);
  };

  const generateExcel = () => {
    setExportingExcel(true);

    // Create CSV content
    let csvContent = '';
    
    // Header
    csvContent += 'Government Polytechnic College\n';
    csvContent += 'Smart Attendance System\n';
    csvContent += `${title}\n\n`;

    if (studentInfo) {
      csvContent += `Enrollment No,${studentInfo.enrollment}\n`;
      csvContent += `Name,${studentInfo.name}\n\n`;
    }

    // Column headers
    csvContent += columns.map(col => col.header).join(',') + '\n';

    // Data rows
    data.forEach(row => {
      csvContent += columns.map(col => {
        let value = row[col.key] || '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',') + '\n';
    });

    // Summary
    if (summary) {
      csvContent += '\nSummary\n';
      csvContent += `Working Days,${summary.workingDays}\n`;
      csvContent += `Present Days,${summary.presentDays}\n`;
      csvContent += `Absent Days,${summary.absentDays}\n`;
      csvContent += `Attendance %,${summary.percentage.toFixed(1)}%\n`;
    }

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setExportingExcel(false);
    toast.success('Excel file downloaded');
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={generatePDF}
        disabled={exportingPdf}
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-50"
      >
        {exportingPdf ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        Download PDF
      </Button>
      <Button
        onClick={generateExcel}
        disabled={exportingExcel}
        variant="outline"
        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      >
        {exportingExcel ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 mr-2" />
        )}
        Download Excel
      </Button>
    </div>
  );
}