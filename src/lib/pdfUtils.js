export const generatePDF = (title, subtitle, contentHTML) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
        .header h1 { color: #1e40af; font-size: 24px; margin-bottom: 5px; }
        .header p { color: #64748b; font-size: 13px; }
        .subtitle { font-size: 16px; font-weight: bold; margin: 20px 0 10px; color: #334155; }
        .info-box { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .info-box p { margin: 3px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
        th { background: #1e40af; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #e2e8f0; padding: 8px 10px; }
        tr:nth-child(even) { background: #f8fafc; }
        .present { color: #059669; font-weight: bold; }
        .absent { color: #dc2626; font-weight: bold; }
        .holiday { color: #d97706; font-weight: bold; }
        .summary { margin-top: 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 15px 0; }
        .summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
        .summary-card .label { font-size: 12px; color: #64748b; }
        .summary-card .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Smart Attendance System</h1>
        <p>Diploma Engineering Project</p>
      </div>
      <div class="subtitle">${title}</div>
      ${subtitle ? `<div class="info-box">${subtitle}</div>` : ''}
      ${contentHTML}
      <div class="footer">
        Generated on ${new Date().toLocaleString()} | Smart Attendance System
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
};