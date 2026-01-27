import { useState, useEffect, useRef, useMemo } from "react";
import { useSalaryPayments, useCreateSalaryPayment, useDeleteSalaryPayment } from "@/hooks/use-salary-payments";
import { useStaff } from "@/hooks/use-staff";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { insertSalaryPaymentSchema, type InsertSalaryPayment, type SalaryPayment, type Staff } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Printer, Wallet, BarChart3, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { SalaryReceipt } from "@/components/salary-receipt";
import { generatePrintHtml, printDocument } from "@/lib/print-utils";

export default function SalaryPaymentsPage() {
  const { data: salaryPayments, isLoading } = useSalaryPayments();
  const { data: staffList } = useStaff();
  const { data: settings } = useSchoolSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<{ payment: SalaryPayment; staff: Staff } | null>(null);
  
  // Analysis state
  const [analysisStartDate, setAnalysisStartDate] = useState<string>("");
  const [analysisEndDate, setAnalysisEndDate] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");

  const getStaffName = (staffId: number) => {
    const person = staffList?.find(s => s.id === staffId);
    return person?.fullName || `کارمەند #${staffId}`;
  };

  const getStaffByPayment = (payment: SalaryPayment) => {
    return staffList?.find(s => s.id === payment.staffId);
  };

  const totalPaid = salaryPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  
  // Filter payments by date range
  const filteredPaymentsByDate = useMemo(() => {
    if (!salaryPayments) return [];
    
    return salaryPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      
      if (analysisStartDate) {
        const start = new Date(analysisStartDate);
        if (paymentDate < start) return false;
      }
      
      if (analysisEndDate) {
        const end = new Date(analysisEndDate);
        end.setHours(23, 59, 59, 999);
        if (paymentDate > end) return false;
      }
      
      return true;
    });
  }, [salaryPayments, analysisStartDate, analysisEndDate]);
  
  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (!analysisStartDate && !analysisEndDate) return "هەموو کات";
    if (analysisStartDate && analysisEndDate) return `${analysisStartDate} تا ${analysisEndDate}`;
    if (analysisStartDate) return `لە ${analysisStartDate}`;
    if (analysisEndDate) return `تا ${analysisEndDate}`;
    return "هەموو کات";
  }, [analysisStartDate, analysisEndDate]);
  
  // Calculate totals by staff member
  const staffTotals = useMemo(() => {
    const totals: Record<number, { staffId: number; staffName: string; amount: number }> = {};
    
    filteredPaymentsByDate.forEach(payment => {
      const staffId = payment.staffId;
      if (!totals[staffId]) {
        totals[staffId] = {
          staffId,
          staffName: getStaffName(staffId),
          amount: 0
        };
      }
      totals[staffId].amount += Number(payment.amount);
    });
    
    return Object.values(totals).sort((a, b) => b.amount - a.amount);
  }, [filteredPaymentsByDate, staffList]);
  
  // Filter payments by selected staff
  const staffFilteredPayments = useMemo(() => {
    if (selectedStaffId === "all") return filteredPaymentsByDate;
    return filteredPaymentsByDate.filter(p => p.staffId === Number(selectedStaffId));
  }, [filteredPaymentsByDate, selectedStaffId]);
  
  const staffFilteredTotal = staffFilteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

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

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
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

      {/* Staff Salary Analysis Section */}
      <Card className="shadow-lg border-purple-200 dark:border-purple-900/50">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            شیکاری مووچەی فەرمانبەران
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">لە:</span>
              <Input
                type="date"
                value={analysisStartDate}
                onChange={(e) => setAnalysisStartDate(e.target.value)}
                className="w-[140px]"
                data-testid="input-analysis-start-date"
              />
              <span className="text-sm text-muted-foreground">تا:</span>
              <Input
                type="date"
                value={analysisEndDate}
                onChange={(e) => setAnalysisEndDate(e.target.value)}
                className="w-[140px]"
                data-testid="input-analysis-end-date"
              />
              {(analysisStartDate || analysisEndDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAnalysisStartDate(""); setAnalysisEndDate(""); setSelectedStaffId("all"); }}
                  data-testid="button-clear-analysis-dates"
                >
                  پاککردنەوە
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const html = generatePrintHtml({
                  title: `شیکاری مووچە - ${dateRangeLabel}`,
                  settings,
                  filterText: selectedStaffId !== "all" 
                    ? `فەرمانبەر: ${getStaffName(Number(selectedStaffId))} | کۆ: ${staffFilteredTotal.toLocaleString()} د.ع`
                    : `کۆی گشتی: ${staffFilteredTotal.toLocaleString()} د.ع`,
                  tableHeaders: selectedStaffId === "all" 
                    ? ["ژ", "ناوی فەرمانبەر", "کۆی مووچە (د.ع)"]
                    : ["ژ", "ناوی فەرمانبەر", "بڕ (د.ع)", "مانگ", "بەروار"],
                  tableRows: selectedStaffId === "all"
                    ? staffTotals.map((s, i) => [
                        String(i + 1),
                        s.staffName,
                        s.amount.toLocaleString()
                      ])
                    : staffFilteredPayments.map((p, i) => [
                        String(i + 1),
                        getStaffName(p.staffId),
                        Number(p.amount).toLocaleString(),
                        p.month,
                        format(new Date(p.date), "yyyy-MM-dd")
                      ])
                });
                printDocument(html);
              }}
              data-testid="button-print-analysis"
            >
              <Printer className="h-4 w-4" />
              چاپکردن
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary by staff */}
          {selectedStaffId === "all" ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                ماوە: <span className="font-medium text-foreground">{dateRangeLabel}</span>
                {" | "}
                کۆی مووچە: <span className="font-bold text-purple-600">{staffFilteredTotal.toLocaleString()} د.ع</span>
              </div>
              {staffTotals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">هیچ مووچەیەک لەم ماوەیەدا نییە</div>
              ) : (
                <div className="grid gap-3">
                  {staffTotals.map((item, idx) => (
                    <div
                      key={item.staffId}
                      className="flex items-center justify-between gap-4 flex-wrap p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => setSelectedStaffId(String(item.staffId))}
                      data-testid={`button-staff-${idx}`}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-sm font-bold text-purple-600">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{item.staffName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-purple-600 font-mono">{item.amount.toLocaleString()} د.ع</span>
                        <TrendingDown className="h-4 w-4 text-purple-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div className="text-sm text-muted-foreground">
                  فەرمانبەر: <span className="font-medium text-foreground">{getStaffName(Number(selectedStaffId))}</span>
                  {" | "}
                  ماوە: <span className="font-medium text-foreground">{dateRangeLabel}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedStaffId("all")}
                  data-testid="button-back-to-all-staff"
                >
                  گەڕانەوە بۆ هەموو فەرمانبەران
                </Button>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg flex items-center justify-between gap-4 flex-wrap mb-4">
                <span className="font-medium">کۆی مووچەی "{getStaffName(Number(selectedStaffId))}"</span>
                <span className="text-2xl font-bold text-purple-600">{staffFilteredTotal.toLocaleString()} د.ع</span>
              </div>
              {staffFilteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">هیچ مووچەیەک لەم ماوەیەدا نییە</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-[50px]">ژ</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">مانگ</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffFilteredPayments.map((payment, idx) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-purple-600 font-bold">{Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell className="font-mono">{format(new Date(payment.date), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-purple-100 dark:bg-purple-900/30 font-bold">
                      <TableCell></TableCell>
                      <TableCell className="text-purple-700 dark:text-purple-400 font-mono">{staffFilteredTotal.toLocaleString()} د.ع</TableCell>
                      <TableCell colSpan={2}>کۆی گشتی</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const html = generatePrintHtml({
                title: "مووچەکان",
                settings,
                filterText: `کۆی گشتی: ${totalPaid.toLocaleString()} د.ع`,
                tableHeaders: ["ژ", "ناوی فەرمانبەر", "بڕی مووچە (د.ع)", "مانگ", "بەروار"],
                tableRows: salaryPayments?.map((payment, i) => [
                  String(i + 1),
                  getStaffName(payment.staffId),
                  Number(payment.amount).toLocaleString(),
                  payment.month,
                  new Date(payment.date).toLocaleDateString()
                ]) || []
              });
              printDocument(html);
            }}
            data-testid="button-print-salaries"
          >
            <Printer className="h-4 w-4 ml-2" /> چاپکردن
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-salary">
            <Plus className="h-4 w-4 ml-2" /> خەرجکردنی مووچە
          </Button>
        </div>
      </div>

      <Card className="p-4">
        {salaryPayments?.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">هیچ مووچەیەک تۆمار نەکراوە</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[60px]">ژ</TableHead>
                <TableHead className="text-right">ناوی فەرمانبەر</TableHead>
                <TableHead className="text-right">بڕی مووچە (د.ع)</TableHead>
                <TableHead className="text-right">مانگ</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right">ڕێکەوت و کات</TableHead>
                <TableHead className="text-right w-[100px]">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryPayments?.map((payment, index) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                  <TableCell className="font-medium">{getStaffName(payment.staffId)}</TableCell>
                  <TableCell className="text-purple-600 font-bold font-mono">
                    {Number(payment.amount).toLocaleString()} د.ع
                  </TableCell>
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
              {salaryPayments && salaryPayments.length > 0 && (
                <TableRow className="bg-purple-100 dark:bg-purple-900/40 font-bold">
                  <TableCell></TableCell>
                  <TableCell>کۆی گشتی</TableCell>
                  <TableCell className="font-mono text-purple-700 dark:text-purple-400">{totalPaid.toLocaleString()} د.ع</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
              )}
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
