import { type SchoolSettings } from "@shared/routes";

export interface PrintOptions {
  title: string;
  settings?: SchoolSettings | null;
  filterText?: string;
  tableHeaders: string[];
  tableRows: string[][];
}

export function generatePrintHtml(options: PrintOptions): string {
  const { title, settings, filterText, tableHeaders, tableRows } = options;
  const schoolName = settings?.schoolName || "قوتابخانەی لوتکەی ناحکومی";
  const logoUrl = settings?.logoUrl || "";
  const logoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="لۆگۆ" class="logo" />`
    : '';

  const headersHtml = tableHeaders.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = tableRows.map(row => 
    `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ku">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { 
          font-family: 'Vazirmatn', Arial, sans-serif; 
          direction: rtl; 
          padding: 20px; 
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        h1 { 
          text-align: center; 
          margin-bottom: 10px; 
          font-size: 18px;
        }
        .subtitle {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .filter { 
          text-align: center; 
          margin-bottom: 20px; 
          color: #666; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        th, td { 
          border: 1px solid #333; 
          padding: 8px; 
          text-align: right; 
        }
        th { 
          background: #f0f0f0; 
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          font-size: 12px; 
          color: #888; 
        }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoHtml}
        <h1>${schoolName}</h1>
        <div class="subtitle">${title}</div>
      </div>
      ${filterText ? `<div class="filter">${filterText}</div>` : ""}
      <table>
        <thead>
          <tr>${headersHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer">چاپکرا لە بەرواری ${new Date().toLocaleDateString()}</div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;
}

export function printDocument(html: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}
