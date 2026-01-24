import { useState } from "react";
import { useFoodPayments, useCreateFoodPayment, useDeleteFoodPayment } from "@/hooks/use-food-payments";
import { useStudents } from "@/hooks/use-students";
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
                          <th>ناوی قوتابی</th>
                          <th>پۆل</th>
                          <th>بڕ (د.ع)</th>
                          <th>مانگ</th>
                          <th>بەروار</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredPayments?.map(payment => `
                          <tr>
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
                <TableHead className="text-right">ناوی قوتابی</TableHead>
                <TableHead className="text-right">پۆل</TableHead>
                <TableHead className="text-right">بڕ (د.ع)</TableHead>
                <TableHead className="text-right">مانگ</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right w-[80px]">سڕینەوە</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments?.map((payment) => (
                <FoodPaymentRow 
                  key={payment.id} 
                  payment={payment} 
                  studentName={getStudentName(payment.studentId)}
                  studentGrade={getStudentGrade(payment.studentId)}
                />
              ))}
              {filteredPayments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    هیچ پارەیەکی خواردن وەرنەگیراوە
                  </TableCell>
                </TableRow>
              )}
              {filteredPayments && filteredPayments.length > 0 && (
                <TableRow className="bg-orange-100 dark:bg-orange-900/40 font-bold">
                  <TableCell>کۆی گشتی</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-mono text-orange-700 dark:text-orange-400">{totalPaid.toLocaleString()} د.ع</TableCell>
                  <TableCell colSpan={3}></TableCell>
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

function FoodPaymentRow({ payment, studentName, studentGrade }: { payment: FoodPayment; studentName: string; studentGrade: string }) {
  const { mutate: deletePayment } = useDeleteFoodPayment();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟")) {
      deletePayment(payment.id, {
        onSuccess: () => toast({ title: "سڕایەوە", description: "تۆمارەکە سڕایەوە" }),
        onError: () => toast({ title: "هەڵە", description: "سڕینەوە سەرنەکەوت", variant: "destructive" }),
      });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{studentName}</TableCell>
      <TableCell className="text-slate-500">{studentGrade}</TableCell>
      <TableCell className="text-orange-600 font-bold font-mono">{Number(payment.amount).toLocaleString()} د.ع</TableCell>
      <TableCell className="text-slate-500">{payment.month}</TableCell>
      <TableCell className="text-slate-500 font-mono">
        {format(new Date(payment.date), "yyyy-MM-dd")}
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDelete}
          data-testid={`button-delete-${payment.id}`}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
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
