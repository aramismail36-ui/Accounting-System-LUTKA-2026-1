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

  // Helper to get student name
  const getStudentName = (id: number) => students?.find(s => s.id === id)?.fullName || "نەزانراو";
  const getStudent = (id: number) => students?.find(s => s.id === id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="قیستەکان"
        description="وەرگرتنی قیستی قوتابیان و چاپکردنی وەسڵ"
        action={
          <Button
            size="lg"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            وەرگرتنی قیست
          </Button>
        }
      />

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
                <TableHead className="text-right">بڕی واصل (د.ع)</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right w-[100px]">وەسڵ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                  <TableCell className="text-indigo-600 font-bold font-mono">{Number(payment.amount).toLocaleString()} د.ع</TableCell>
                  <TableCell className="text-slate-500 font-mono">
                    {format(new Date(payment.date), "yyyy-MM-dd")}
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
              {payments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    هیچ قیستێک وەرنەگیراوە
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreatePaymentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} students={students || []} />
      
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

function CreatePaymentDialog({ open, onOpenChange, students }: { open: boolean, onOpenChange: (open: boolean) => void, students: any[] }) {
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
