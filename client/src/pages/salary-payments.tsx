import { useState, useEffect, useRef } from "react";
import { useSalaryPayments, useCreateSalaryPayment, useDeleteSalaryPayment } from "@/hooks/use-salary-payments";
import { useStaff } from "@/hooks/use-staff";
import { insertSalaryPaymentSchema, type InsertSalaryPayment, type SalaryPayment, type Staff } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Printer, Wallet } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { SalaryReceipt } from "@/components/salary-receipt";

export default function SalaryPaymentsPage() {
  const { data: salaryPayments, isLoading } = useSalaryPayments();
  const { data: staffList } = useStaff();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<{ payment: SalaryPayment; staff: Staff } | null>(null);

  const getStaffName = (staffId: number) => {
    const person = staffList?.find(s => s.id === staffId);
    return person?.fullName || `کارمەند #${staffId}`;
  };

  const getStaffByPayment = (payment: SalaryPayment) => {
    return staffList?.find(s => s.id === payment.staffId);
  };

  const totalPaid = salaryPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="خەرجکردنی مووچە"
        description="بەڕێوەبردنی مووچەی مانگانەی فەرمانبەران"
      />

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">کۆی مووچەی خەرجکراو</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {totalPaid.toLocaleString()} د.ع
          </h2>
        </div>
        <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
          <Wallet className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-salary">
          <Plus className="h-4 w-4 ml-2" /> خەرجکردنی مووچە
        </Button>
      </div>

      <Card className="p-4">
        {salaryPayments?.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">هیچ مووچەیەک تۆمار نەکراوە</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">ناوی فەرمانبەر</TableHead>
                <TableHead className="text-right">بڕی مووچە (د.ع)</TableHead>
                <TableHead className="text-right">مانگ</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right w-[100px]">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryPayments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getStaffName(payment.staffId)}</TableCell>
                  <TableCell className="text-purple-600 font-bold font-mono">
                    {Number(payment.amount).toLocaleString()} د.ع
                  </TableCell>
                  <TableCell className="text-slate-500">{payment.month}</TableCell>
                  <TableCell className="text-slate-500 font-mono">
                    {format(new Date(payment.date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-blue-500"
                        onClick={() => {
                          const staff = getStaffByPayment(payment);
                          if (staff) {
                            setReceiptPayment({ payment, staff });
                          }
                        }}
                        data-testid={`button-print-${payment.id}`}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <DeleteSalaryButton id={payment.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateSalaryDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        staffList={staffList || []} 
      />

      {receiptPayment && (
        <SalaryReceipt
          payment={receiptPayment.payment}
          staff={receiptPayment.staff}
          onClose={() => setReceiptPayment(null)}
        />
      )}
    </div>
  );
}

function DeleteSalaryButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteSalaryPayment();
  const { toast } = useToast();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-400 hover:text-red-500"
      disabled={isPending}
      onClick={() => {
        if (confirm("دڵنیای لە سڕینەوە؟")) {
          mutate(id, {
            onSuccess: () => toast({ title: "سڕایەوە", description: "تۆماری مووچە سڕایەوە" }),
          });
        }
      }}
      data-testid={`button-delete-${id}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function CreateSalaryDialog({ 
  open, 
  onOpenChange, 
  staffList 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  staffList: Staff[];
}) {
  const { mutate, isPending } = useCreateSalaryPayment();
  const { toast } = useToast();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const formSchema = insertSalaryPaymentSchema.extend({
    staffId: z.coerce.number().min(1, "تکایە فەرمانبەر هەڵبژێرە"),
    amount: z.coerce.number().min(1, "بڕی مووچە دەبێت لە ٠ زیاتر بێت"),
    date: z.coerce.string(),
    month: z.string().min(1, "مانگ دەبێت هەڵبژێردرێت"),
  });

  const form = useForm<InsertSalaryPayment>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: 0,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      month: currentMonth,
      notes: "",
    },
  });

  const selectedStaffId = form.watch("staffId");
  const selectedStaff = staffList.find(s => s.id === Number(selectedStaffId));

  useEffect(() => {
    if (selectedStaff) {
      form.setValue("amount", Number(selectedStaff.salary));
    }
  }, [selectedStaff, form]);

  function onSubmit(data: InsertSalaryPayment) {
    const payload = {
      ...data,
      amount: String(data.amount),
    };
    mutate(payload as any, {
      onSuccess: () => {
        toast({ title: "تۆمارکرا", description: "مووچەی فەرمانبەر خەرجکرا" });
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
          <DialogTitle>خەرجکردنی مووچەی فەرمانبەر</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ناوی فەرمانبەر</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(Number(val))} 
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-staff">
                        <SelectValue placeholder="فەرمانبەر هەڵبژێرە..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.fullName} - {s.role}
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
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
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
                  <FormLabel>بڕی مووچە (د.ع)</FormLabel>
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
                  <FormLabel>بەرواری وەرگرتن</FormLabel>
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
                  <FormLabel>تێبینی</FormLabel>
                  <FormControl>
                    <Input placeholder="تێبینی ئارەزوومەندانە..." {...field} value={field.value || ""} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full" data-testid="button-submit">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              تۆمارکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
