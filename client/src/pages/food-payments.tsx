import { useState } from "react";
import { useFoodPayments, useCreateFoodPayment, useDeleteFoodPayment } from "@/hooks/use-food-payments";
import { useStudents } from "@/hooks/use-students";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { useCurrentFiscalYear } from "@/hooks/use-fiscal-years";
import { insertFoodPaymentSchema, type InsertFoodPayment, type FoodPayment, type Student } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Printer, Loader2, Trash2, UtensilsCrossed } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { formatAmountWithWords } from "@/lib/number-to-kurdish";

export default function FoodPaymentsPage() {
  const { data: foodPayments, isLoading } = useFoodPayments();
  const { data: students } = useStudents();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  const grades = Array.from(new Set(students?.map(s => s.grade).filter(Boolean) || []));

  const getStudentName = (id: number) => students?.find(s => s.id === id)?.fullName || "نەزانراو";
  const getStudentGrade = (id: number) => students?.find(s => s.id === id)?.grade || "";

  const filteredPayments = foodPayments?.filter(payment => {
    if (selectedGrade === "all") return true;
    const student = students?.find(s => s.id === payment.studentId);
    return student?.grade === selectedGrade;
  });

  const filteredStudents = selectedGrade === "all" 
    ? students || []
    : students?.filter(s => s.grade === selectedGrade) || [];

  const totalPaid = filteredPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="پارەی خواردن"
        description="وەرگرتنی پارەی خواردن لە قوتابیان"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (!printWindow) return;
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html dir="rtl" lang="ku">
                  <head>
                    <meta charset="UTF-8">
                    <title>لیستی پارەی خواردن</title>
                    <style>
                      body { font-family: 'Vazirmatn', Arial, sans-serif; direction: rtl; padding: 20px; }
                      h1 { text-align: center; margin-bottom: 10px; }
                      .summary { text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold; color: #ea580c; }
                      table { width: 100%; border-collapse: collapse; }
                      th, td { border: 1px solid #333; padding: 8px; text-align: right; }
                      th { background: #f0f0f0; }
                      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
                    </style>
                  </head>
                  <body>
                    <h1>قوتابخانەی لوتکەی ناحکومی - پارەی خواردن</h1>
                    ${selectedGrade !== "all" ? `<div class="filter">پۆل: ${selectedGrade}</div>` : ""}
                    <div class="summary">کۆی گشتی: ${totalPaid.toLocaleString()} د.ع</div>
                    <table>
                      <thead>
                        <tr>
                          <th>ژ</th>
                          <th>ناوی قوتابی</th>
                          <th>پۆل</th>
                          <th>بڕ (د.ع)</th>
                          <th>مانگ</th>
                          <th>بەروار</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredPayments?.map((payment, i) => `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${getStudentName(payment.studentId)}</td>
                            <td>${getStudentGrade(payment.studentId)}</td>
                            <td style="color: #ea580c; font-weight: bold;">${Number(payment.amount).toLocaleString()}</td>
                            <td>${payment.month}</td>
                            <td>${new Date(payment.date).toLocaleDateString()}</td>
                          </tr>
                        `).join('') || ''}
                      </tbody>
                    </table>
                    <div class="footer">چاپکرا لە بەرواری ${new Date().toLocaleDateString()}</div>
                    <script>window.onload = function() { window.print(); }</script>
                  </body>
                  </html>
                `);
                printWindow.document.close();
              }}
              data-testid="button-print-food-payments"
            >
              <Printer className="h-5 w-5" />
              چاپکردن
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-food-payment"
            >
              <Plus className="h-5 w-5" />
              وەرگرتنی پارەی خواردن
            </Button>
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">کۆی پارەی خواردنی وەرگیراو</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {totalPaid.toLocaleString()} د.ع
          </h2>
        </div>
        <div className="h-16 w-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
          <UtensilsCrossed className="h-8 w-8 text-orange-600" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-[200px]" data-testid="select-grade-filter">
            <SelectValue placeholder="هەموو پۆلەکان" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">هەموو پۆلەکان</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade} value={grade || ""}>
                {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedGrade !== "all" && (
          <span className="text-sm text-muted-foreground">
            {filteredPayments?.length || 0} تۆمار لە {selectedGrade}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[60px]">ژ</TableHead>
                <TableHead className="text-right">ناوی قوتابی</TableHead>
                <TableHead className="text-right">پۆل</TableHead>
                <TableHead className="text-right">بڕ (د.ع)</TableHead>
                <TableHead className="text-right">مانگ</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right">ڕێکەوت و کات</TableHead>
                <TableHead className="text-right">کردارەکان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments?.map((payment, index) => (
                <FoodPaymentRow
                  rowNumber={index + 1} 
                  key={payment.id} 
                  payment={payment} 
                  studentName={getStudentName(payment.studentId)}
                  studentGrade={getStudentGrade(payment.studentId)}
                />
              ))}
              {filteredPayments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    هیچ پارەیەکی خواردن وەرنەگیراوە
                  </TableCell>
                </TableRow>
              )}
              {filteredPayments && filteredPayments.length > 0 && (
                <TableRow className="bg-orange-100 dark:bg-orange-900/40 font-bold">
                  <TableCell></TableCell>
                  <TableCell>کۆی گشتی</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-mono text-orange-700 dark:text-orange-400">{totalPaid.toLocaleString()} د.ع</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateFoodPaymentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} students={filteredStudents} />
    </div>
  );
}

function FoodPaymentRow({ payment, studentName, studentGrade, rowNumber }: { payment: FoodPayment; studentName: string; studentGrade: string; rowNumber: number }) {
  const { mutate: deletePayment } = useDeleteFoodPayment();
  const { data: settings } = useSchoolSettings();
  const { data: currentFiscalYear } = useCurrentFiscalYear();
  const { toast } = useToast();
  const fiscalYearLabel = currentFiscalYear?.year || "";
  const schoolAddress = settings?.address || "";
  const schoolPhone = settings?.phone || "";

  const handleDelete = () => {
    if (confirm("ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟")) {
      deletePayment(payment.id, {
        onSuccess: () => toast({ title: "سڕایەوە", description: "تۆمارەکە سڕایەوە" }),
        onError: () => toast({ title: "هەڵە", description: "سڕینەوە سەرنەکەوت", variant: "destructive" }),
      });
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const schoolName = settings?.schoolName || "قوتابخانەی لوتکەی ناحکومی";
    const logoUrl = settings?.logoUrl || "";
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="لۆگۆ" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 5px;" />`
      : '';
    const amountInfo = formatAmountWithWords(Number(payment.amount));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>وەسڵی پارەی خواردن</title>
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
            border: 3px solid #ea580c;
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
            background: linear-gradient(90deg, #ea580c 0%, #f97316 25%, #fbbf24 50%, #f97316 75%, #ea580c 100%);
          }
          .decorative-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #ea580c 0%, #f97316 25%, #fbbf24 50%, #f97316 75%, #ea580c 100%);
          }
          .corner-decoration {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 3px solid #f97316;
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
            border: 3px solid #ea580c;
            padding: 3px;
            background: white;
          }
          .header-text {
            text-align: center;
          }
          .header-text h1 {
            font-size: 20px;
            color: #ea580c;
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
            background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
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
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border: 1px solid #fed7aa;
            border-radius: 12px;
            padding: 15px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #fed7aa;
            font-size: 12px;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #ea580c;
            font-weight: 600;
          }
          .info-value {
            color: #9a3412;
            font-weight: bold;
          }
          .amount-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .amount-box {
            background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ea580c 100%);
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(234, 88, 12, 0.35);
            border: 3px solid #fdba74;
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
            color: #fed7aa;
            margin-bottom: 8px;
            position: relative;
          }
          .amount-number {
            font-size: 32px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            margin-bottom: 10px;
            position: relative;
          }
          .amount-words {
            font-size: 11px;
            color: #ffedd5;
            background: rgba(255,255,255,0.15);
            padding: 6px 14px;
            border-radius: 20px;
            display: inline-block;
            position: relative;
          }
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
            border-top: 2px solid #ea580c;
            margin-top: 25px;
            padding-top: 8px;
            color: #ea580c;
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
            background: #fff7ed;
            border: 1px solid #f97316;
            color: #ea580c;
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
          
          <div class="receipt-badge">وەسڵی پارەی خواردن</div>
          <div class="receipt-number-badge">F-${String(payment.id).padStart(6, '0')}</div>
          
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
                    <span class="info-value">${studentName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">پۆل:</span>
                    <span class="info-value">${studentGrade || "نەدیاریکراو"}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">مانگ:</span>
                    <span class="info-value">${payment.month}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">بەرواری وەرگرتن:</span>
                    <span class="info-value">${format(new Date(payment.date), "yyyy-MM-dd")}</span>
                  </div>
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

  return (
    <TableRow>
      <TableCell className="text-muted-foreground font-mono">{rowNumber}</TableCell>
      <TableCell className="font-medium">{studentName}</TableCell>
      <TableCell className="text-slate-500">{studentGrade}</TableCell>
      <TableCell className="text-orange-600 font-bold font-mono">{Number(payment.amount).toLocaleString()} د.ع</TableCell>
      <TableCell className="text-slate-500">{payment.month}</TableCell>
      <TableCell className="text-slate-500 font-mono">
        {format(new Date(payment.date), "yyyy-MM-dd")}
      </TableCell>
      <TableCell className="text-slate-500 text-xs font-mono">
        {new Date(payment.createdAt).toLocaleString('ku-Arab', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={printReceipt}
            data-testid={`button-print-food-${payment.id}`}
          >
            <Printer className="h-4 w-4 text-orange-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            data-testid={`button-delete-food-${payment.id}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface FoodPaymentFormData {
  studentId: number;
  amount: number;
  month: string;
  date: string;
  notes?: string;
}

function CreateFoodPaymentDialog({ open, onOpenChange, students }: { open: boolean; onOpenChange: (open: boolean) => void; students: Student[] }) {
  const { mutate, isPending } = useCreateFoodPayment();
  const { toast } = useToast();

  const formSchema = z.object({
    studentId: z.coerce.number().min(1, "تکایە قوتابی هەڵبژێرە"),
    amount: z.coerce.number().min(1, "بڕی پارە دەبێت لە ٠ زیاتر بێت"),
    month: z.string().min(1, "تکایە مانگ هەڵبژێرە"),
    date: z.string(),
    notes: z.string().optional(),
  });

  const form = useForm<FoodPaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: 0,
      amount: 0,
      month: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  function onSubmit(data: FoodPaymentFormData) {
    const payload = {
      studentId: data.studentId,
      amount: String(data.amount),
      month: data.month,
      date: data.date,
      notes: data.notes || null,
    };
    mutate(payload as any, {
      onSuccess: () => {
        toast({ title: "تۆمارکرا", description: "پارەی خواردن وەرگیرا" });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "هەڵە", description: err.message, variant: "destructive" });
      },
    });
  }

  const months = [
    { value: "2026-01", label: "کانوونی دووەم ٢٠٢٦" },
    { value: "2026-02", label: "شوبات ٢٠٢٦" },
    { value: "2026-03", label: "ئازار ٢٠٢٦" },
    { value: "2026-04", label: "نیسان ٢٠٢٦" },
    { value: "2026-05", label: "ئایار ٢٠٢٦" },
    { value: "2026-06", label: "حوزەیران ٢٠٢٦" },
    { value: "2026-07", label: "تەممووز ٢٠٢٦" },
    { value: "2026-08", label: "ئاب ٢٠٢٦" },
    { value: "2026-09", label: "ئەیلوول ٢٠٢٦" },
    { value: "2026-10", label: "تشرینی یەکەم ٢٠٢٦" },
    { value: "2026-11", label: "تشرینی دووەم ٢٠٢٦" },
    { value: "2026-12", label: "کانوونی یەکەم ٢٠٢٦" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>وەرگرتنی پارەی خواردن</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ناوی قوتابی</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(Number(val))} 
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-student">
                        <SelectValue placeholder="قوتابی هەڵبژێرە..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.fullName} - {s.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مانگ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-month">
                        <SelectValue placeholder="مانگ هەڵبژێرە..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بڕی پارە (د.ع)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بەروار</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تێبینی (ئارەزوومەندانە)</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تۆمارکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
