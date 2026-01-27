import { useState, useMemo } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/use-finance";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { insertExpenseSchema, type InsertExpense } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Receipt, Loader2, Trash2, Printer, TrendingDown, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { format, startOfMonth, startOfYear, isAfter, isEqual } from "date-fns";
import { generatePrintHtml, printDocument } from "@/lib/print-utils";

const EXPENSE_CATEGORIES = ["مووچە", "ئاو", "کارەبا", "ئینتەرنێت", "چاککردنەوە", "پاککردنەوە", "سووتەمەنی", "تر"];

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: settings } = useSchoolSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [analysisCategory, setAnalysisCategory] = useState<string>("all");

  const totalExpenses = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  // Filter expenses by date range
  const filteredExpensesByPeriod = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      
      if (startDate) {
        const start = new Date(startDate);
        if (expDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (expDate > end) return false;
      }
      
      return true;
    });
  }, [expenses, startDate, endDate]);
  
  // Format date range for display
  const dateRangeLabel = useMemo(() => {
    if (!startDate && !endDate) return "هەموو کات";
    if (startDate && endDate) return `${startDate} تا ${endDate}`;
    if (startDate) return `لە ${startDate}`;
    if (endDate) return `تا ${endDate}`;
    return "هەموو کات";
  }, [startDate, endDate]);

  // Get unique categories from expenses
  const uniqueCategories = useMemo(() => {
    if (!expenses) return EXPENSE_CATEGORIES;
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats);
  }, [expenses]);

  // Calculate expense totals by category for filtered period
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpensesByPeriod.forEach(exp => {
      const cat = exp.category;
      totals[cat] = (totals[cat] || 0) + Number(exp.amount);
    });
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpensesByPeriod]);

  // Filter by specific category if selected
  const categoryFilteredExpenses = useMemo(() => {
    if (analysisCategory === "all") return filteredExpensesByPeriod;
    return filteredExpensesByPeriod.filter(e => e.category === analysisCategory);
  }, [filteredExpensesByPeriod, analysisCategory]);

  const categoryFilteredTotal = categoryFilteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="خەرجییەکان"
        description="تۆمارکردنی خەرجییەکانی ڕۆژانە و مانگانە"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                const html = generatePrintHtml({
                  title: "خەرجییەکان",
                  settings,
                  filterText: `کۆی گشتی: ${totalExpenses.toLocaleString()} د.ع`,
                  tableHeaders: ["ژ", "جۆر / بەش", "بڕ (د.ع)", "بەروار", "تێبینی"],
                  tableRows: expenses?.map((item, i) => [
                    String(i + 1),
                    item.category,
                    `-${Number(item.amount).toLocaleString()}`,
                    new Date(item.date).toLocaleDateString(),
                    item.description || '-'
                  ]) || []
                });
                printDocument(html);
              }}
              data-testid="button-print-expenses"
            >
              <Printer className="h-5 w-5" />
              چاپکردن
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="gap-2"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-expense"
            >
              <Plus className="h-5 w-5" />
              زیادکردنی خەرجی
            </Button>
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-slate-500">کۆی گشتی خەرجییەکان</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {totalExpenses.toLocaleString()} د.ع
          </h2>
        </div>
        <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
          <Receipt className="h-8 w-8 text-red-600" />
        </div>
      </div>

      {/* Expense Analysis Section */}
      <Card className="shadow-lg border-orange-200 dark:border-orange-900/50">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            شیکاری خەرجی بەپێی بابەت
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">لە:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[140px]"
                data-testid="input-start-date"
              />
              <span className="text-sm text-muted-foreground">تا:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[140px]"
                data-testid="input-end-date"
              />
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  data-testid="button-clear-dates"
                >
                  پاککردنەوە
                </Button>
              )}
            </div>
            <Select value={analysisCategory} onValueChange={setAnalysisCategory}>
              <SelectTrigger className="w-[160px]" data-testid="select-analysis-category">
                <SelectValue placeholder="هەڵبژاردنی بابەت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو بابەتەکان</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const html = generatePrintHtml({
                  title: `شیکاری خەرجی - ${dateRangeLabel}`,
                  settings,
                  filterText: analysisCategory !== "all" 
                    ? `بابەت: ${analysisCategory} | کۆ: ${categoryFilteredTotal.toLocaleString()} د.ع`
                    : `کۆی گشتی: ${categoryFilteredTotal.toLocaleString()} د.ع`,
                  tableHeaders: analysisCategory === "all" 
                    ? ["ژ", "بابەت", "کۆی خەرجی (د.ع)"]
                    : ["ژ", "بابەت", "بڕ (د.ع)", "بەروار", "تێبینی"],
                  tableRows: analysisCategory === "all"
                    ? categoryTotals.map((c, i) => [
                        String(i + 1),
                        c.category,
                        c.amount.toLocaleString()
                      ])
                    : categoryFilteredExpenses.map((e, i) => [
                        String(i + 1),
                        e.category,
                        Number(e.amount).toLocaleString(),
                        format(new Date(e.date), "yyyy-MM-dd"),
                        e.description || '-'
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
          {/* Summary by category */}
          {analysisCategory === "all" ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                ماوە: <span className="font-medium text-foreground">{dateRangeLabel}</span>
                {" | "}
                کۆی خەرجی: <span className="font-bold text-red-600">{categoryFilteredTotal.toLocaleString()} د.ع</span>
              </div>
              {categoryTotals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">هیچ خەرجییەک لەم ماوەیەدا نییە</div>
              ) : (
                <div className="grid gap-3">
                  {categoryTotals.map((item, idx) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between gap-4 flex-wrap p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => setAnalysisCategory(item.category)}
                      data-testid={`button-category-${idx}`}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-sm font-bold text-orange-600">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-red-600 font-mono">{item.amount.toLocaleString()} د.ع</span>
                        <TrendingDown className="h-4 w-4 text-red-500" />
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
                  بابەت: <span className="font-medium text-foreground">{analysisCategory}</span>
                  {" | "}
                  ماوە: <span className="font-medium text-foreground">{dateRangeLabel}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setAnalysisCategory("all")}
                  data-testid="button-back-to-all"
                >
                  گەڕانەوە بۆ هەموو بابەتەکان
                </Button>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex items-center justify-between gap-4 flex-wrap mb-4">
                <span className="font-medium">کۆی خەرجی بۆ "{analysisCategory}"</span>
                <span className="text-2xl font-bold text-red-600">{categoryFilteredTotal.toLocaleString()} د.ع</span>
              </div>
              {categoryFilteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">هیچ خەرجییەک لەم بابەتەدا نییە</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-[50px]">ژ</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                      <TableHead className="text-right">تێبینی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryFilteredExpenses.map((exp, idx) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-red-600 font-bold">{Number(exp.amount).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{format(new Date(exp.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-muted-foreground">{exp.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-orange-100 dark:bg-orange-900/30 font-bold">
                      <TableCell></TableCell>
                      <TableCell className="text-red-700 dark:text-red-400 font-mono">{categoryFilteredTotal.toLocaleString()} د.ع</TableCell>
                      <TableCell colSpan={2}>کۆی گشتی</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                <TableHead className="text-right">جۆر / بەش</TableHead>
                <TableHead className="text-right">بڕ (د.ع)</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right">تێبینی</TableHead>
                <TableHead className="text-right">ڕێکەوت و کات</TableHead>
                <TableHead className="text-right w-[100px]">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-red-600 font-bold font-mono">-{Number(item.amount).toLocaleString()} د.ع</TableCell>
                  <TableCell className="text-slate-500 font-mono">
                    {format(new Date(item.date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-slate-500">{item.description || "-"}</TableCell>
                  <TableCell className="text-slate-500 text-xs font-mono">
                    {new Date(item.createdAt).toLocaleString('ku-Arab', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <DeleteExpenseButton id={item.id} />
                  </TableCell>
                </TableRow>
              ))}
              {expenses?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    هیچ خەرجییەک تۆمار نەکراوە
                  </TableCell>
                </TableRow>
              )}
              {expenses && expenses.length > 0 && (
                <TableRow className="bg-red-100 dark:bg-red-900/40 font-bold">
                  <TableCell></TableCell>
                  <TableCell>کۆی گشتی</TableCell>
                  <TableCell className="font-mono text-red-700 dark:text-red-400">-{totalExpenses.toLocaleString()} د.ع</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateExpenseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

function DeleteExpenseButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      await fetch(url, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({ title: "سڕایەوە", description: "خەرجی بە سەرکەوتوویی سڕایەوە" });
    }
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive"
      disabled={isPending}
      onClick={() => {
        if(confirm("دڵنیای لە سڕینەوە؟")) mutate(id);
      }}
      data-testid={`button-delete-expense-${id}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function CreateExpenseDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateExpense();
  const { toast } = useToast();

  const formSchema = insertExpenseSchema.extend({
    amount: z.coerce.number(),
    date: z.coerce.string(),
  });

  const form = useForm<InsertExpense>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      amount: 0,
      description: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(data: InsertExpense) {
    const payload = {
      ...data,
      amount: String(data.amount),
    };
    mutate(payload as any, {
      onSuccess: () => {
        toast({ title: "تۆمارکرا", description: "خەرجی بە سەرکەوتوویی تۆمارکرا" });
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
          <DialogTitle>تۆمارکردنی خەرجی نوێ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>جۆر / بەش</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="نم: کارەبا..." {...field} list="expense-categories" />
                      <datalist id="expense-categories">
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بڕ (د.ع)</FormLabel>
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تێبینی (ئارەزوومەندانە)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="destructive" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تۆمارکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
