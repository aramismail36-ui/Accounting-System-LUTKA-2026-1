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
            size: A5 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Vazirmatn', 'Nrt', Arial, sans-serif;
            direction: rtl;
            background: #f5f5f5;
            min-height: 100vh;
          }
          .receipt {
            width: 148mm;
            min-height: 210mm;
            background: #f8f8f8;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
            padding: 20px 25px 30px;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='80' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.1'/%3E%3Ccircle cx='100' cy='100' r='60' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.1'/%3E%3Ccircle cx='100' cy='100' r='40' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M100 20 L100 180 M20 100 L180 100 M35 35 L165 165 M165 35 L35 165' stroke='%23ffffff' stroke-width='0.3' opacity='0.08'/%3E%3C/svg%3E");
            background-size: 150px;
            background-position: left center;
            background-repeat: no-repeat;
            opacity: 0.6;
          }
          .orange-bar-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #f59e0b, #f97316, #ea580c);
          }
          .header-content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-container {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: white;
            padding: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            flex-shrink: 0;
          }
          .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
          }
          .header-text {
            flex: 1;
          }
          .school-name {
            font-size: 22px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 5px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          .school-tagline {
            font-size: 11px;
            color: #e5e5e5;
            margin-bottom: 8px;
          }
          .header-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: 10px;
            color: #d1d5db;
          }
          .header-info-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .receipt-type-badge {
            position: absolute;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 3px 10px rgba(245, 158, 11, 0.4);
          }
          .body {
            padding: 20px 25px;
            background: #f8f8f8;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 12px;
            padding-bottom: 5px;
            border-bottom: 2px solid #f59e0b;
            display: inline-block;
          }
          .info-section {
            background: white;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #e5e5e5;
            font-size: 11px;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #666;
          }
          .info-value {
            color: #1a1a2e;
            font-weight: bold;
          }
          .amount-section {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 15px;
            position: relative;
            overflow: hidden;
          }
          .amount-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent, rgba(245,158,11,0.1), transparent);
          }
          .amount-label {
            font-size: 11px;
            color: #f59e0b;
            margin-bottom: 8px;
            position: relative;
          }
          .amount-number {
            font-size: 32px;
            font-weight: bold;
            color: #f59e0b;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            margin-bottom: 8px;
            position: relative;
          }
          .amount-words {
            font-size: 11px;
            color: #e5e5e5;
            background: rgba(245,158,11,0.2);
            padding: 6px 16px;
            border-radius: 20px;
            display: inline-block;
            position: relative;
          }
          .summary-section {
            background: white;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 10px;
            font-size: 10px;
            border-radius: 5px;
            margin-bottom: 5px;
          }
          .summary-row.total { background: #f0f9ff; }
          .summary-row.paid { background: #f0fdf4; color: #16a34a; }
          .summary-row.remaining { background: #fef2f2; color: #dc2626; }
          .summary-row.debt { background: #fffbeb; color: #92400e; border: 1px solid #fbbf24; }
          .signature-section {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            margin-top: 10px;
          }
          .signature-box {
            width: 42%;
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #1a1a2e;
            margin-top: 30px;
            padding-top: 8px;
            font-size: 10px;
            color: #1a1a2e;
            font-weight: 600;
          }
          .footer {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 12px 25px;
            position: relative;
          }
          .orange-bar-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #f59e0b, #f97316, #ea580c);
          }
          .footer-text {
            text-align: center;
            font-size: 10px;
            color: #d1d5db;
            position: relative;
            z-index: 1;
          }
          .footer-thanks {
            color: #f59e0b;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .receipt-number {
            position: absolute;
            top: 12px;
            left: 25px;
            background: rgba(245,158,11,0.2);
            color: #f59e0b;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="orange-bar-top"></div>
            <div class="receipt-number">P-${String(payment.id).padStart(6, '0')}</div>
            <div class="header-content">
              ${logoUrl ? `
              <div class="logo-container">
                <img src="${logoUrl}" alt="لۆگۆ" />
              </div>
              ` : ''}
              <div class="header-text">
                <div class="school-name">${schoolName}</div>
                <div class="school-tagline">سیستەمی ژمێریاری قوتابخانە</div>
                <div class="header-info">
                  ${schoolAddress ? `<div class="header-info-item">📍 ${schoolAddress}</div>` : ''}
                  ${schoolPhone ? `<div class="header-info-item">📞 ${schoolPhone}</div>` : ''}
                  ${fiscalYearLabel ? `<div class="header-info-item">📅 ساڵی خوێندن: ${fiscalYearLabel}</div>` : ''}
                </div>
              </div>
            </div>
            <div class="receipt-type-badge">وەسڵی قیست</div>
          </div>
          
          <div class="body">
            <div class="section-title">زانیاری قوتابی :</div>
            <div class="info-section">
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
            
            <div class="amount-section">
              <div class="amount-label">بڕی پارەی وەرگیراو</div>
              <div class="amount-number">${amountInfo.number}</div>
              <div class="amount-words">${amountInfo.words}</div>
            </div>
            
            <div class="section-title">زانیاری حیساب :</div>
            <div class="summary-section">
              <div class="summary-row total">
                <span>کۆی مەبلەغی خوێندن:</span>
                <span style="font-weight: bold;">${Number(student.tuitionFee).toLocaleString()} د.ع</span>
              </div>
              <div class="summary-row paid">
                <span>کۆی پارەی دراو:</span>
                <span style="font-weight: bold;">${Number(student.paidAmount).toLocaleString()} د.ع</span>
              </div>
              <div class="summary-row remaining">
                <span>ماوە:</span>
                <span style="font-weight: bold;">${Number(student.remainingAmount).toLocaleString()} د.ع</span>
              </div>
              ${Number(student.previousYearDebt || 0) > 0 ? `
              <div class="summary-row debt">
                <span>قەرزی ساڵی پێشوو:</span>
                <span style="font-weight: bold;">${Number(student.previousYearDebt).toLocaleString()} د.ع</span>
              </div>
              ` : ''}
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">مۆر و واژووی بەخێوکار</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">مۆر و واژووی ژمێریار</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              <div class="footer-thanks">سوپاس بۆ متمانەکەتان</div>
              <div>ئەم وەسڵە لە بەرواری ${format(new Date(), "yyyy-MM-dd")} چاپکراوە</div>
            </div>
            <div class="orange-bar-bottom"></div>
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
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b bg-slate-50">
          <h2 className="text-base font-bold text-slate-700">پێشبینینی وەسڵ</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-amber-500 hover:bg-amber-600" data-testid="button-print-receipt">
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-4 relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
            <div className="absolute top-2 left-3 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              P-{String(payment.id).padStart(6, '0')}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {logoUrl && (
                <div className="w-12 h-12 rounded-full bg-white p-1 shadow-lg flex-shrink-0">
                  <img src={logoUrl} alt="لۆگۆ" className="w-full h-full object-contain rounded-full" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-amber-400 font-bold text-sm">{schoolName}</h1>
                <p className="text-gray-400 text-[9px]">سیستەمی ژمێریاری قوتابخانە</p>
                {schoolAddress && <p className="text-gray-400 text-[8px]">📍 {schoolAddress}</p>}
                {schoolPhone && <p className="text-gray-400 text-[8px]">📞 {schoolPhone}</p>}
              </div>
            </div>
            <span className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              وەسڵی قیست
            </span>
          </div>

          <div className="p-3 bg-gray-100">
            <div className="text-amber-500 text-[10px] font-bold mb-1.5 border-b border-amber-400 pb-0.5 inline-block">زانیاری قوتابی :</div>
            <div className="bg-white rounded-lg p-2 mb-2 shadow-sm">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] border-b border-dotted border-gray-200 pb-1">
                  <span className="text-gray-500">ناوی قوتابی:</span>
                  <span className="font-bold text-slate-800">{student.fullName}</span>
                </div>
                <div className="flex justify-between text-[10px] border-b border-dotted border-gray-200 pb-1">
                  <span className="text-gray-500">پۆل:</span>
                  <span className="font-bold text-slate-800">{student.grade || "نەدیاریکراو"}</span>
                </div>
                <div className="flex justify-between text-[10px] border-b border-dotted border-gray-200 pb-1">
                  <span className="text-gray-500">مۆبایل:</span>
                  <span className="font-bold text-slate-800">{student.mobile}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">بەروار:</span>
                  <span className="font-bold text-slate-800">{format(new Date(payment.date), "yyyy-MM-dd")}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-3 mb-2 text-center">
              <div className="text-amber-400 text-[9px] mb-1">بڕی پارەی وەرگیراو</div>
              <div className="text-amber-400 text-xl font-bold mb-1">{amountInfo.number}</div>
              <div className="text-gray-300 text-[9px] bg-amber-500/20 px-2 py-0.5 rounded-full inline-block">{amountInfo.words}</div>
            </div>

            <div className="text-amber-500 text-[10px] font-bold mb-1.5 border-b border-amber-400 pb-0.5 inline-block">زانیاری حیساب :</div>
            <div className="bg-white rounded-lg p-2 mb-2 shadow-sm space-y-1">
              <div className="flex justify-between text-[9px] bg-blue-50 p-1 rounded">
                <span className="text-blue-600">کۆی مەبلەغ:</span>
                <span className="font-bold">{Number(student.tuitionFee).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-[9px] bg-green-50 p-1 rounded">
                <span className="text-green-600">دراو:</span>
                <span className="font-bold text-green-600">{Number(student.paidAmount).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-[9px] bg-red-50 p-1 rounded">
                <span className="text-red-600">ماوە:</span>
                <span className="font-bold text-red-600">{Number(student.remainingAmount).toLocaleString()} د.ع</span>
              </div>
              {Number(student.previousYearDebt || 0) > 0 && (
                <div className="flex justify-between text-[9px] bg-amber-50 p-1 rounded border border-amber-300">
                  <span className="text-amber-700">قەرزی پێشوو:</span>
                  <span className="font-bold text-amber-700">{Number(student.previousYearDebt).toLocaleString()} د.ع</span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <div className="text-center w-[42%]">
                <div className="border-t-2 border-slate-800 mt-4 pt-1 text-slate-700 font-medium text-[8px]">مۆر و واژووی بەخێوکار</div>
              </div>
              <div className="text-center w-[42%]">
                <div className="border-t-2 border-slate-800 mt-4 pt-1 text-slate-700 font-medium text-[8px]">مۆر و واژووی ژمێریار</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-2 text-center relative">
            <div className="text-amber-400 text-[9px] font-bold">سوپاس بۆ متمانەکەتان</div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
