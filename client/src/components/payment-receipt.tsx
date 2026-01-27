import { type Payment, type Student } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { formatAmountWithWords } from "@/lib/number-to-kurdish";
import { useSchoolSettings } from "@/hooks/use-school-settings";

interface PaymentReceiptProps {
  payment: Payment;
  student: Student;
  onClose: () => void;
}

export function PaymentReceipt({ payment, student, onClose }: PaymentReceiptProps) {
  const { data: settings } = useSchoolSettings();
  const schoolName = settings?.schoolName || "قوتابخانەی لوتکەی ناحکومی";
  const logoUrl = settings?.logoUrl || "";

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const amountInfo = formatAmountWithWords(Number(payment.amount));
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="لۆگۆ" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 5px;" />`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>وەسڵی وەرگرتنی قیست</title>
        <style>
          @page {
            size: A6 landscape;
            margin: 5mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Vazirmatn', 'Nrt', Arial, sans-serif;
            direction: rtl;
            padding: 8mm;
            width: 148mm;
            height: 105mm;
            font-size: 11px;
          }
          .receipt {
            border: 2px solid #1e40af;
            border-radius: 8px;
            padding: 12px;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%);
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.08;
            z-index: 0;
            pointer-events: none;
          }
          .watermark img {
            width: 180px;
            height: 180px;
            object-fit: contain;
          }
          .content-wrapper {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 8px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            margin: -12px -12px 10px -12px;
            padding: 10px;
            border-radius: 6px 6px 0 0;
          }
          .header-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-bottom: 4px;
            border-radius: 50%;
            background: white;
            padding: 4px;
          }
          .header h1 {
            font-size: 14px;
            margin-bottom: 2px;
            color: white;
          }
          .header p {
            font-size: 9px;
            color: #bfdbfe;
          }
          .receipt-title {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            margin: 6px 0;
            padding: 6px;
            background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
            border-radius: 6px;
            color: white;
            letter-spacing: 1px;
          }
          .receipt-number {
            text-align: center;
            font-size: 10px;
            margin-bottom: 8px;
            background: #dbeafe;
            padding: 5px;
            border-radius: 4px;
            color: #1e40af;
            font-weight: bold;
            border: 1px solid #93c5fd;
          }
          .content {
            flex: 1;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 5px 8px;
            border-bottom: 1px dashed #93c5fd;
            font-size: 10px;
            background: rgba(255,255,255,0.7);
            margin-bottom: 2px;
            border-radius: 3px;
          }
          .row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #1e40af;
          }
          .value {
            font-weight: bold;
            color: #1e3a8a;
          }
          .amount-box {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
            color: white;
            padding: 14px;
            border-radius: 10px;
            margin: 10px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
            border: 2px solid #60a5fa;
          }
          .amount-number {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
          }
          .amount-words {
            font-size: 10px;
            opacity: 0.95;
            background: rgba(255,255,255,0.15);
            padding: 4px 10px;
            border-radius: 12px;
            display: inline-block;
          }
          .summary-box {
            background: rgba(255,255,255,0.8);
            border: 1px solid #93c5fd;
            border-radius: 6px;
            padding: 8px;
            margin-top: 6px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            padding: 3px 0;
            color: #1e3a8a;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 8px;
          }
          .signature-box {
            width: 45%;
            text-align: center;
            font-size: 9px;
          }
          .signature-line {
            border-top: 1.5px solid #1e40af;
            margin-top: 18px;
            padding-top: 5px;
            color: #1e40af;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 8px;
            color: #3b82f6;
            margin-top: 6px;
            padding-top: 5px;
            border-top: 1px solid #93c5fd;
          }
          .debt-warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 6px;
            border-radius: 4px;
            margin-top: 4px;
            border: 1px solid #f59e0b;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${logoUrl ? `<div class="watermark"><img src="${logoUrl}" alt="لۆگۆ" /></div>` : ''}
          <div class="content-wrapper">
            <div class="header">
              ${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" class="header-logo" />` : ''}
              <h1>${schoolName}</h1>
              <p>سیستەمی ژمێریاری قوتابخانە</p>
            </div>
            
            <div class="receipt-title">وەسڵی وەرگرتنی قیست</div>
            <div class="receipt-number">
              ژمارەی وەسڵ: P-${String(payment.id).padStart(6, '0')}
            </div>
            
            <div class="content">
              <div class="row">
                <span class="label">ناوی قوتابی:</span>
                <span class="value">${student.fullName}</span>
              </div>
              <div class="row">
                <span class="label">پۆل:</span>
                <span class="value">${student.grade || "نەدیاریکراو"}</span>
              </div>
              <div class="row">
                <span class="label">ژمارەی مۆبایل:</span>
                <span class="value">${student.mobile}</span>
              </div>
              <div class="row">
                <span class="label">بەرواری وەرگرتن:</span>
                <span class="value">${format(new Date(payment.date), "yyyy-MM-dd")}</span>
              </div>
              
              <div class="amount-box">
                <div class="amount-number">${amountInfo.number}</div>
                <div class="amount-words">${amountInfo.words}</div>
              </div>
              
              <div class="summary-box">
                <div class="summary-row">
                  <span>کۆی مەبلەغی خوێندن:</span>
                  <span style="font-weight: bold;">${Number(student.tuitionFee).toLocaleString()} د.ع</span>
                </div>
                <div class="summary-row">
                  <span>کۆی پارەی دراو:</span>
                  <span style="font-weight: bold; color: #16a34a;">${Number(student.paidAmount).toLocaleString()} د.ع</span>
                </div>
                <div class="summary-row">
                  <span>ماوە:</span>
                  <span style="font-weight: bold; color: #dc2626;">${Number(student.remainingAmount).toLocaleString()} د.ع</span>
                </div>
              </div>
              ${Number(student.previousYearDebt || 0) > 0 ? `
              <div class="debt-warning">
                <div class="summary-row" style="color: #92400e;">
                  <span style="font-weight: bold;">قەرزی ساڵی پێشوو:</span>
                  <span style="font-weight: bold;">${Number(student.previousYearDebt).toLocaleString()} د.ع</span>
                </div>
              </div>
              ` : ''}
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">واژووی بەخێوکار</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">واژووی ژمێریار</div>
              </div>
            </div>
            
            <div class="footer">
              ئەم وەسڵە لە بەرواری ${format(new Date(), "yyyy-MM-dd")} چاپکراوە
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const amountInfo = formatAmountWithWords(Number(payment.amount));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">پێشبینینی وەسڵ</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} data-testid="button-print-receipt">
              <Printer className="h-4 w-4 ml-2" /> چاپکردن
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-2 border-blue-700 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
          {logoUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none">
              <img src={logoUrl} alt="واتەرمارک" className="w-48 h-48 object-contain" />
            </div>
          )}
          
          <div className="relative z-10">
            <div className="text-center bg-gradient-to-r from-blue-800 to-blue-600 text-white py-4 px-4 rounded-lg mb-4 -mx-2 -mt-2">
              {logoUrl && (
                <img src={logoUrl} alt="لۆگۆ" className="w-14 h-14 object-contain mx-auto mb-2 bg-white rounded-full p-1" />
              )}
              <h1 className="text-xl font-bold">{schoolName}</h1>
              <p className="text-blue-200 text-sm">سیستەمی ژمێریاری قوتابخانە</p>
            </div>

            <div className="text-center bg-gradient-to-r from-blue-700 to-blue-600 text-white py-3 rounded-lg mb-3">
              <span className="text-lg font-bold">وەسڵی وەرگرتنی قیست</span>
            </div>

            <div className="text-center bg-blue-100 border border-blue-300 py-2 rounded-lg mb-4">
              <span className="text-sm font-bold text-blue-700">ژمارەی وەسڵ: P-{String(payment.id).padStart(6, '0')}</span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between border-b border-dashed border-blue-300 pb-2 bg-white/70 px-3 py-1 rounded">
                <span className="text-blue-700 font-medium">ناوی قوتابی:</span>
                <span className="font-bold text-blue-900">{student.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-blue-300 pb-2 bg-white/70 px-3 py-1 rounded">
                <span className="text-blue-700 font-medium">پۆل:</span>
                <span className="font-bold text-blue-900">{student.grade || "نەدیاریکراو"}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-blue-300 pb-2 bg-white/70 px-3 py-1 rounded">
                <span className="text-blue-700 font-medium">ژمارەی مۆبایل:</span>
                <span className="font-bold text-blue-900">{student.mobile}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-blue-300 pb-2 bg-white/70 px-3 py-1 rounded">
                <span className="text-blue-700 font-medium">بەرواری وەرگرتن:</span>
                <span className="font-bold text-blue-900">{format(new Date(payment.date), "yyyy-MM-dd")}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 text-white p-5 rounded-xl text-center mb-4 shadow-lg border-2 border-blue-400">
              <div className="text-3xl font-bold mb-2">{amountInfo.number}</div>
              <div className="bg-white/20 inline-block px-4 py-1 rounded-full text-blue-100">{amountInfo.words}</div>
            </div>

            <div className="space-y-2 mb-4 bg-white/80 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between">
                <span className="text-blue-700">کۆی مەبلەغی خوێندن:</span>
                <span className="font-bold text-blue-900">{Number(student.tuitionFee).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">کۆی پارەی دراو:</span>
                <span className="font-bold text-green-600">{Number(student.paidAmount).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">ماوە:</span>
                <span className="font-bold text-red-600">{Number(student.remainingAmount).toLocaleString()} د.ع</span>
              </div>
              {Number(student.previousYearDebt || 0) > 0 && (
                <div className="flex justify-between bg-amber-100 p-2 rounded mt-2 border border-amber-300">
                  <span className="text-amber-700 font-medium">قەرزی ساڵی پێشوو:</span>
                  <span className="font-bold text-amber-700">{Number(student.previousYearDebt).toLocaleString()} د.ع</span>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6 pt-4">
              <div className="text-center w-[45%]">
                <div className="border-t-2 border-blue-700 mt-10 pt-2 text-blue-700 font-medium">واژووی بەخێوکار</div>
              </div>
              <div className="text-center w-[45%]">
                <div className="border-t-2 border-blue-700 mt-10 pt-2 text-blue-700 font-medium">واژووی ژمێریار</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
