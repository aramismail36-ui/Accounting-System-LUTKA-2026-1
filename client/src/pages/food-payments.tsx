import { useState } from "react";
import { useFoodPayments, useCreateFoodPayment, useDeleteFoodPayment } from "@/hooks/use-food-payments";
import { useStudents } from "@/hooks/use-students";
import { useSchoolSettings } from "@/hooks/use-school-settings";
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
  const { toast } = useToast();

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
            
            <div class="receipt-title">وەسڵی پارەی خواردن</div>
            <div class="receipt-number">
              ژمارەی وەسڵ: F-${String(payment.id).padStart(6, '0')}
            </div>
            
            <div class="content">
              <div class="row">
                <span class="label">ناوی قوتابی:</span>
                <span class="value">${studentName}</span>
              </div>
              <div class="row">
                <span class="label">پۆل:</span>
                <span class="value">${studentGrade || "نەدیاریکراو"}</span>
              </div>
              <div class="row">
                <span class="label">مانگ:</span>
                <span class="value">${payment.month}</span>
              </div>
              <div class="row">
                <span class="label">بەرواری وەرگرتن:</span>
                <span class="value">${format(new Date(payment.date), "yyyy-MM-dd")}</span>
              </div>
              
              <div class="amount-box">
                <div class="amount-number">${amountInfo.number}</div>
                <div class="amount-words">${amountInfo.words}</div>
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
              بەروار: ${new Date().toLocaleDateString('ku-Arab')}
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
