import { useState } from "react";
import { usePayments, useCreatePayment } from "@/hooks/use-finance";
import { useStudents } from "@/hooks/use-students";
import { insertPaymentSchema, type InsertPayment, type Payment, type Student } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Printer, Loader2, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { PaymentReceipt } from "@/components/payment-receipt";

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const { data: students } = useStudents();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ payment: Payment; student: Student } | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  // Get unique grades from students
  const grades = Array.from(new Set(students?.map(s => s.grade).filter(Boolean) || []));

  // Helper to get student info
  const getStudentName = (id: number) => students?.find(s => s.id === id)?.fullName || "نەزانراو";
  const getStudentGrade = (id: number) => students?.find(s => s.id === id)?.grade || "";
  const getStudent = (id: number) => students?.find(s => s.id === id);

  // Filter payments by grade
  const filteredPayments = payments?.filter(payment => {
    if (selectedGrade === "all") return true;
    const student = getStudent(payment.studentId);
    return student?.grade === selectedGrade;
  });

  // Filter students for dialog by grade
  const filteredStudents = selectedGrade === "all" 
    ? students || []
    : students?.filter(s => s.grade === selectedGrade) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="قیستەکان"
        description="وەرگرتنی قیستی قوتابیان و چاپکردنی وەسڵ"
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
                    <title>لیستی قیستەکان</title>
                    <style>
                      body { font-family: 'Vazirmatn', Arial, sans-serif; direction: rtl; padding: 20px; }
                      h1 { text-align: center; margin-bottom: 10px; }
                      .filter { text-align: center; margin-bottom: 20px; color: #666; }
                      table { width: 100%; border-collapse: collapse; }
                      th, td { border: 1px solid #333; padding: 8px; text-align: right; }
                      th { background: #f0f0f0; }
                      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
                    </style>
                  </head>
                  <body>
                    <h1>قوتابخانەی لوتکەی ناحکومی - قیستەکان</h1>
                    ${selectedGrade !== "all" ? `<div class="filter">پۆل: ${selectedGrade}</div>` : ""}
                    <table>
                      <thead>
                        <tr>
                          <th>ژ</th>
                          <th>ناوی قوتابی</th>
                          <th>پۆل</th>
                          <th>بڕی واصل (د.ع)</th>
                          <th>بەروار</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredPayments?.map((payment, i) => `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${getStudentName(payment.studentId)}</td>
                            <td>${getStudentGrade(payment.studentId)}</td>
                            <td style="color: #4f46e5; font-weight: bold;">${Number(payment.amount).toLocaleString()}</td>
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
              data-testid="button-print-payments"
            >
              <Printer className="h-5 w-5" />
              چاپکردن
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-payment"
            >
              <Plus className="h-5 w-5" />
              وەرگرتنی قیست
            </Button>
          </div>
        }
      />

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
            {filteredPayments?.length || 0} قیست لە {selectedGrade}
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
                <TableHead className="text-right">بڕی واصل (د.ع)</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right">ڕێکەوت و کات</TableHead>
                <TableHead className="text-right w-[100px]">وەسڵ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments?.map((payment, index) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                  <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                  <TableCell className="text-slate-500">{getStudentGrade(payment.studentId)}</TableCell>
                  <TableCell className="text-indigo-600 font-bold font-mono">{Number(payment.amount).toLocaleString()} د.ع</TableCell>
                  <TableCell className="text-slate-500 font-mono">
                    {format(new Date(payment.date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs font-mono">
                    {new Date(payment.createdAt).toLocaleString('ku-Arab', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        const student = getStudent(payment.studentId);
                        if (student) {
                          setReceiptData({ payment, student });
                        }
                      }}
                      data-testid={`button-print-${payment.id}`}
                    >
                      <Printer className="h-4 w-4 text-slate-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    هیچ قیستێک وەرنەگیراوە
                  </TableCell>
                </TableRow>
              )}
              {filteredPayments && filteredPayments.length > 0 && (
                <TableRow className="bg-indigo-100 dark:bg-indigo-900/40 font-bold">
                  <TableCell></TableCell>
                  <TableCell>کۆی گشتی</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-mono text-indigo-700 dark:text-indigo-400">{filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()} د.ع</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreatePaymentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} students={filteredStudents} selectedGrade={selectedGrade} />
      
      {receiptData && (
        <PaymentReceipt
          payment={receiptData.payment}
          student={receiptData.student}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}

interface PaymentFormData {
  studentId: number;
  amount: number;
  date: string;
}

function CreatePaymentDialog({ open, onOpenChange, students, selectedGrade }: { open: boolean, onOpenChange: (open: boolean) => void, students: any[], selectedGrade: string }) {
  const { mutate, isPending } = useCreatePayment();
  const { toast } = useToast();

  const formSchema = z.object({
    amount: z.coerce.number().min(1, "بڕی پارە دەبێت لە ٠ زیاتر بێت"),
    studentId: z.coerce.number().min(1, "تکایە قوتابی هەڵبژێرە"),
    date: z.string(),
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: 0,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(data: PaymentFormData) {
    const payload = {
      studentId: data.studentId,
      amount: String(data.amount),
      date: data.date,
    };
    mutate(payload, {
      onSuccess: () => {
        toast({ title: "سەرکەوتوو بوو", description: "قیستەکە وەرگیرا" });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "هەڵە", description: err.message, variant: "destructive" });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>وەرگرتنی قیستی نوێ</DialogTitle>
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
                      <SelectTrigger>
                        <SelectValue placeholder="قوتابی هەڵبژێرە..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.fullName}
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
                    <Input type="number" {...field} />
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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg flex items-center gap-3 text-indigo-700 dark:text-indigo-300">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">ئەم بڕە بەشێوەیەکی ئۆتۆماتیکی لە پارەی ماوەی قوتابیەکە دەشکێنرێت.</p>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              وەرگرتن و چاپکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
