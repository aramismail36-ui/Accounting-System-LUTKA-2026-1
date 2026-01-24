import { type Payment, type Student } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { formatAmountWithWords } from "@/lib/number-to-kurdish";

interface PaymentReceiptProps {
  payment: Payment;
  student: Student;
  onClose: () => void;
}

export function PaymentReceipt({ payment, student, onClose }: PaymentReceiptProps) {
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
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Vazirmatn', 'Nrt', Arial, sans-serif;
            direction: rtl;
            padding: 15mm;
            width: 210mm;
            height: 148mm;
          }
          .receipt {
            border: 2px solid #333;
            padding: 20px;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 14px;
            color: #666;
          }
          .receipt-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 15px 0;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
          }
          .content {
            flex: 1;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px dashed #ccc;
          }
          .row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            font-weight: bold;
          }
          .amount-box {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
          }
          .amount-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .amount-words {
            font-size: 16px;
            opacity: 0.9;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 30px;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #333;
            margin-top: 50px;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #888;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>قوتابخانەی لوتکەی ناحکومی</h1>
            <p>سیستەمی ژمێریاری قوتابخانە</p>
          </div>
          
          <div class="receipt-title">وەسڵی وەرگرتنی قیست</div>
          
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
            
            <div class="row">
              <span class="label">کۆی مەبلەغی خوێندن:</span>
              <span class="value">${Number(student.tuitionFee).toLocaleString()} د.ع</span>
            </div>
            <div class="row">
              <span class="label">کۆی پارەی دراو:</span>
              <span class="value">${Number(student.paidAmount).toLocaleString()} د.ع</span>
            </div>
            <div class="row">
              <span class="label">ماوە:</span>
              <span class="value">${Number(student.remainingAmount).toLocaleString()} د.ع</span>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">واژووی بەلاوەکار</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">واژووی ژمێریار</div>
            </div>
          </div>
          
          <div class="footer">
            ئەم وەسڵە لە بەرواری ${format(new Date(), "yyyy-MM-dd")} چاپکراوە
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

        <div className="border-2 border-slate-300 rounded-lg p-6 bg-white">
          <div className="text-center border-b-2 border-slate-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-800">قوتابخانەی لوتکەی ناحکومی</h1>
            <p className="text-slate-500">سیستەمی ژمێریاری قوتابخانە</p>
          </div>

          <div className="text-center bg-slate-100 py-3 rounded-lg mb-4">
            <span className="text-lg font-bold">وەسڵی وەرگرتنی قیست</span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">ناوی قوتابی:</span>
              <span className="font-bold">{student.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">پۆل:</span>
              <span className="font-bold">{student.grade || "نەدیاریکراو"}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">ژمارەی مۆبایل:</span>
              <span className="font-bold">{student.mobile}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">بەرواری وەرگرتن:</span>
              <span className="font-bold">{format(new Date(payment.date), "yyyy-MM-dd")}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-xl text-center mb-4">
            <div className="text-3xl font-bold mb-2">{amountInfo.number}</div>
            <div className="text-indigo-100">{amountInfo.words}</div>
          </div>

          <div className="space-y-2 mb-4 bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-slate-600">کۆی مەبلەغی خوێندن:</span>
              <span className="font-bold">{Number(student.tuitionFee).toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">کۆی پارەی دراو:</span>
              <span className="font-bold text-green-600">{Number(student.paidAmount).toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">ماوە:</span>
              <span className="font-bold text-red-600">{Number(student.remainingAmount).toLocaleString()} د.ع</span>
            </div>
          </div>

          <div className="flex justify-between mt-8 pt-4">
            <div className="text-center w-[45%]">
              <div className="border-t-2 border-slate-400 mt-12 pt-2">واژووی بەلاوەکار</div>
            </div>
            <div className="text-center w-[45%]">
              <div className="border-t-2 border-slate-400 mt-12 pt-2">واژووی ژمێریار</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
