import { type Payment, type Student } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { formatAmountWithWords } from "@/lib/number-to-kurdish";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { useCurrentFiscalYear } from "@/hooks/use-fiscal-years";

interface PaymentReceiptProps {
  payment: Payment;
  student: Student;
  onClose: () => void;
}

export function PaymentReceipt({ payment, student, onClose }: PaymentReceiptProps) {
  const { data: settings } = useSchoolSettings();
  const { data: currentFiscalYear } = useCurrentFiscalYear();
  const schoolName = settings?.schoolName || "قوتابخانەی لوتکەی ناحکومی";
  const logoUrl = settings?.logoUrl || "";
  const schoolAddress = settings?.address || "";
  const schoolPhone = settings?.phone || "";
  const fiscalYearLabel = currentFiscalYear?.year || "";

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const amountInfo = formatAmountWithWords(Number(payment.amount));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>وەسڵی وەرگرتنی قیست</title>
        <style>
          @page {
            size: A5 landscape;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Vazirmatn', 'Nrt', Arial, sans-serif;
            direction: rtl;
            padding: 0;
            background: #f8fafc;
          }
          .receipt {
            width: 210mm;
            height: 148mm;
            background: #ffffff;
            border: 3px solid #0f766e;
            border-radius: 16px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .decorative-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #0f766e 0%, #14b8a6 25%, #fbbf24 50%, #14b8a6 75%, #0f766e 100%);
          }
          .decorative-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #0f766e 0%, #14b8a6 25%, #fbbf24 50%, #14b8a6 75%, #0f766e 100%);
          }
          .corner-decoration {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 3px solid #14b8a6;
            opacity: 0.3;
          }
          .corner-tl { top: 15px; right: 15px; border-radius: 0 0 0 30px; border-top: none; border-right: none; }
          .corner-tr { top: 15px; left: 15px; border-radius: 0 0 30px 0; border-top: none; border-left: none; }
          .corner-bl { bottom: 15px; right: 15px; border-radius: 0 30px 0 0; border-bottom: none; border-right: none; }
          .corner-br { bottom: 15px; left: 15px; border-radius: 30px 0 0 0; border-bottom: none; border-left: none; }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
          }
          .watermark img {
            width: 200px;
            height: 200px;
            object-fit: contain;
          }
          .content-wrapper {
            position: relative;
            z-index: 1;
            padding: 20px 25px;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 12px;
          }
          .header-logo {
            width: 55px;
            height: 55px;
            object-fit: contain;
            border-radius: 50%;
            border: 3px solid #0f766e;
            padding: 3px;
            background: white;
          }
          .header-text {
            text-align: center;
          }
          .header-text h1 {
            font-size: 20px;
            color: #0f766e;
            margin-bottom: 3px;
            font-weight: bold;
          }
          .header-text .info {
            font-size: 10px;
            color: #64748b;
          }
          .receipt-badge {
            position: absolute;
            top: 25px;
            left: 25px;
            background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
          }
          .receipt-number-badge {
            position: absolute;
            top: 25px;
            right: 25px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #78350f;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          }
          .main-content {
            display: flex;
            gap: 20px;
            flex: 1;
          }
          .info-section {
            flex: 1;
          }
          .info-card {
            background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
            border: 1px solid #99f6e4;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed #99f6e4;
            font-size: 12px;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #0f766e;
            font-weight: 600;
          }
          .info-value {
            color: #134e4a;
            font-weight: bold;
          }
          .amount-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .amount-box {
            background: linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0f766e 100%);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(15, 118, 110, 0.35);
            border: 3px solid #5eead4;
            position: relative;
            overflow: hidden;
          }
          .amount-box::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: shimmer 3s infinite;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
          }
          .amount-label {
            font-size: 12px;
            color: #99f6e4;
            margin-bottom: 8px;
            position: relative;
          }
          .amount-number {
            font-size: 28px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            margin-bottom: 8px;
            position: relative;
          }
          .amount-words {
            font-size: 11px;
            color: #ccfbf1;
            background: rgba(255,255,255,0.15);
            padding: 6px 14px;
            border-radius: 20px;
            display: inline-block;
            position: relative;
          }
          .summary-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px;
            margin-top: 10px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            font-size: 11px;
            border-radius: 6px;
            margin-bottom: 3px;
          }
          .summary-row.total { background: #f0fdfa; }
          .summary-row.paid { background: #f0fdf4; }
          .summary-row.remaining { background: #fef2f2; }
          .summary-row.debt { background: #fffbeb; border: 1px solid #fbbf24; }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 15px;
          }
          .signature-box {
            width: 42%;
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #0f766e;
            margin-top: 25px;
            padding-top: 8px;
            color: #0f766e;
            font-weight: 600;
            font-size: 11px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
          }
          .fiscal-year-badge {
            display: inline-block;
            background: #f0fdfa;
            border: 1px solid #14b8a6;
            color: #0f766e;
            padding: 3px 12px;
            border-radius: 12px;
            font-size: 10px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="decorative-top"></div>
          <div class="decorative-bottom"></div>
          <div class="corner-decoration corner-tl"></div>
          <div class="corner-decoration corner-tr"></div>
          <div class="corner-decoration corner-bl"></div>
          <div class="corner-decoration corner-br"></div>
          ${logoUrl ? `<div class="watermark"><img src="${logoUrl}" alt="لۆگۆ" /></div>` : ''}
          
          <div class="receipt-badge">وەسڵی وەرگرتنی قیست</div>
          <div class="receipt-number-badge">P-${String(payment.id).padStart(6, '0')}</div>
          
          <div class="content-wrapper">
            <div class="header">
              ${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" class="header-logo" />` : ''}
              <div class="header-text">
                <h1>${schoolName}</h1>
                ${schoolAddress ? `<div class="info">${schoolAddress}</div>` : ''}
                ${schoolPhone ? `<div class="info">تەلەفۆن: ${schoolPhone}</div>` : ''}
                ${fiscalYearLabel ? `<div class="fiscal-year-badge">ساڵی خوێندن: ${fiscalYearLabel}</div>` : ''}
              </div>
            </div>
            
            <div class="main-content">
              <div class="info-section">
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">ناوی قوتابی:</span>
                    <span class="info-value">${student.fullName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">پۆل:</span>
                    <span class="info-value">${student.grade || "نەدیاریکراو"}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">ژمارەی مۆبایل:</span>
                    <span class="info-value">${student.mobile}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">بەرواری وەرگرتن:</span>
                    <span class="info-value">${format(new Date(payment.date), "yyyy-MM-dd")}</span>
                  </div>
                </div>
                
                <div class="summary-card">
                  <div class="summary-row total">
                    <span>کۆی مەبلەغی خوێندن:</span>
                    <span style="font-weight: bold;">${Number(student.tuitionFee).toLocaleString()} د.ع</span>
                  </div>
                  <div class="summary-row paid">
                    <span>کۆی پارەی دراو:</span>
                    <span style="font-weight: bold; color: #16a34a;">${Number(student.paidAmount).toLocaleString()} د.ع</span>
                  </div>
                  <div class="summary-row remaining">
                    <span>ماوە:</span>
                    <span style="font-weight: bold; color: #dc2626;">${Number(student.remainingAmount).toLocaleString()} د.ع</span>
                  </div>
                  ${Number(student.previousYearDebt || 0) > 0 ? `
                  <div class="summary-row debt">
                    <span style="color: #92400e; font-weight: 600;">قەرزی ساڵی پێشوو:</span>
                    <span style="font-weight: bold; color: #92400e;">${Number(student.previousYearDebt).toLocaleString()} د.ع</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="amount-section">
                <div class="amount-box">
                  <div class="amount-label">بڕی پارەی وەرگیراو</div>
                  <div class="amount-number">${amountInfo.number}</div>
                  <div class="amount-words">${amountInfo.words}</div>
                </div>
              </div>
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
      <DialogContent className="sm:max-w-[480px] p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-teal-700">پێشبینینی وەسڵ</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700" data-testid="button-print-receipt">
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-3 border-teal-600 rounded-xl p-4 bg-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 via-amber-400 to-teal-600"></div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 via-amber-400 to-teal-600"></div>
          
          {logoUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none">
              <img src={logoUrl} alt="واتەرمارک" className="w-36 h-36 object-contain" />
            </div>
          )}
          
          <div className="relative z-10 pt-2">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                وەسڵی وەرگرتنی قیست
              </span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                P-{String(payment.id).padStart(6, '0')}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pb-3 border-b-2 border-gray-200 mb-3">
              {logoUrl && (
                <img src={logoUrl} alt="لۆگۆ" className="w-12 h-12 object-contain rounded-full border-2 border-teal-600 p-0.5 bg-white" />
              )}
              <div className="text-center">
                <h1 className="text-lg font-bold text-teal-700">{schoolName}</h1>
                {schoolAddress && <p className="text-gray-500 text-[10px]">{schoolAddress}</p>}
                {schoolPhone && <p className="text-gray-500 text-[10px]">تەلەفۆن: {schoolPhone}</p>}
                {fiscalYearLabel && (
                  <span className="inline-block mt-1 bg-teal-50 border border-teal-300 text-teal-700 text-[10px] px-2 py-0.5 rounded-full">
                    ساڵی خوێندن: {fiscalYearLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-2.5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs border-b border-dashed border-teal-200 pb-1">
                    <span className="text-teal-600 font-medium">ناوی قوتابی:</span>
                    <span className="font-bold text-teal-800">{student.fullName}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-dashed border-teal-200 pb-1">
                    <span className="text-teal-600 font-medium">پۆل:</span>
                    <span className="font-bold text-teal-800">{student.grade || "نەدیاریکراو"}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-dashed border-teal-200 pb-1">
                    <span className="text-teal-600 font-medium">مۆبایل:</span>
                    <span className="font-bold text-teal-800">{student.mobile}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-teal-600 font-medium">بەروار:</span>
                    <span className="font-bold text-teal-800">{format(new Date(payment.date), "yyyy-MM-dd")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-teal-600 rounded-lg p-3 text-center text-white shadow-lg border-2 border-teal-300 flex flex-col justify-center">
                <div className="text-[10px] text-teal-100 mb-1">بڕی پارەی وەرگیراو</div>
                <div className="text-xl font-bold mb-1 drop-shadow-md">{amountInfo.number}</div>
                <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-teal-100 inline-block mx-auto">{amountInfo.words}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-2 mb-3 space-y-1">
              <div className="flex justify-between text-xs bg-teal-50 p-1.5 rounded">
                <span className="text-teal-700">کۆی مەبلەغی خوێندن:</span>
                <span className="font-bold text-teal-800">{Number(student.tuitionFee).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-xs bg-green-50 p-1.5 rounded">
                <span className="text-green-700">کۆی پارەی دراو:</span>
                <span className="font-bold text-green-600">{Number(student.paidAmount).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-xs bg-red-50 p-1.5 rounded">
                <span className="text-red-700">ماوە:</span>
                <span className="font-bold text-red-600">{Number(student.remainingAmount).toLocaleString()} د.ع</span>
              </div>
              {Number(student.previousYearDebt || 0) > 0 && (
                <div className="flex justify-between text-xs bg-amber-50 p-1.5 rounded border border-amber-300">
                  <span className="text-amber-700 font-medium">قەرزی ساڵی پێشوو:</span>
                  <span className="font-bold text-amber-700">{Number(student.previousYearDebt).toLocaleString()} د.ع</span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <div className="text-center w-[42%]">
                <div className="border-t-2 border-teal-600 mt-5 pt-1 text-teal-600 font-medium text-[10px]">واژووی بەخێوکار</div>
              </div>
              <div className="text-center w-[42%]">
                <div className="border-t-2 border-teal-600 mt-5 pt-1 text-teal-600 font-medium text-[10px]">واژووی ژمێریار</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
