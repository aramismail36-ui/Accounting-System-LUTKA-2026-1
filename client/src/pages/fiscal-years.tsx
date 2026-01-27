import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFiscalYears, useCurrentFiscalYear, useCreateFiscalYear, useSetCurrentFiscalYear, useCloseFiscalYear, useDeleteFiscalYear } from "@/hooks/use-fiscal-years";
import { type FiscalYear, type Income, type Expense, type Payment, type SalaryPayment, type FoodPayment } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Calendar, CheckCircle, XCircle, Lock, Unlock, ArrowRight, Archive, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US').format(num) + ' د.ع';
}

function ArchiveViewerDialog({ 
  fiscalYear, 
  isOpen, 
  onClose 
}: { 
  fiscalYear: FiscalYear | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: archivedIncome, isLoading: loadingIncome } = useQuery<Income[]>({
    queryKey: ['/api/archive', fiscalYear?.year, 'income'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${fiscalYear?.year}/income`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isOpen && !!fiscalYear?.year,
  });

  const { data: archivedExpenses, isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ['/api/archive', fiscalYear?.year, 'expenses'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${fiscalYear?.year}/expenses`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isOpen && !!fiscalYear?.year,
  });

  const { data: archivedPayments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ['/api/archive', fiscalYear?.year, 'payments'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${fiscalYear?.year}/payments`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isOpen && !!fiscalYear?.year,
  });

  const { data: archivedSalaries, isLoading: loadingSalaries } = useQuery<SalaryPayment[]>({
    queryKey: ['/api/archive', fiscalYear?.year, 'salary-payments'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${fiscalYear?.year}/salary-payments`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isOpen && !!fiscalYear?.year,
  });

  const { data: archivedFoodPayments, isLoading: loadingFood } = useQuery<FoodPayment[]>({
    queryKey: ['/api/archive', fiscalYear?.year, 'food-payments'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${fiscalYear?.year}/food-payments`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isOpen && !!fiscalYear?.year,
  });

  const totalIncome = archivedIncome?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = archivedExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalPayments = archivedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalSalaries = archivedSalaries?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalFoodPayments = archivedFoodPayments?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            ئەرشیفی ساڵی {fiscalYear?.year}
          </DialogTitle>
          <DialogDescription>
            داتای ئەرشیفکراوی ساڵی دارایی {fiscalYear?.year}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="income" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="income">داهات</TabsTrigger>
            <TabsTrigger value="expenses">خەرجی</TabsTrigger>
            <TabsTrigger value="payments">پارەدان</TabsTrigger>
            <TabsTrigger value="salaries">مووچە</TabsTrigger>
            <TabsTrigger value="food">خواردن</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="mt-4">
            <div className="rounded-lg border p-4 mb-4">
              <p className="text-sm text-muted-foreground">کۆی داهات:</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            {loadingIncome ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : archivedIncome && archivedIncome.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">سەرچاوە</TableHead>
                    <TableHead className="text-right">بڕ</TableHead>
                    <TableHead className="text-right">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedIncome.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">هیچ داهاتێک نییە</p>
            )}
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            <div className="rounded-lg border p-4 mb-4">
              <p className="text-sm text-muted-foreground">کۆی خەرجی:</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            {loadingExpenses ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : archivedExpenses && archivedExpenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">جۆر</TableHead>
                    <TableHead className="text-right">بڕ</TableHead>
                    <TableHead className="text-right">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedExpenses.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">هیچ خەرجییەک نییە</p>
            )}
          </TabsContent>
          
          <TabsContent value="payments" className="mt-4">
            <div className="rounded-lg border p-4 mb-4">
              <p className="text-sm text-muted-foreground">کۆی پارەدان:</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalPayments)}</p>
            </div>
            {loadingPayments ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : archivedPayments && archivedPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">ناسنامەی قوتابی</TableHead>
                    <TableHead className="text-right">بڕ</TableHead>
                    <TableHead className="text-right">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedPayments.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.studentId}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">هیچ پارەدانێک نییە</p>
            )}
          </TabsContent>
          
          <TabsContent value="salaries" className="mt-4">
            <div className="rounded-lg border p-4 mb-4">
              <p className="text-sm text-muted-foreground">کۆی مووچە:</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalSalaries)}</p>
            </div>
            {loadingSalaries ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : archivedSalaries && archivedSalaries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">مانگ</TableHead>
                    <TableHead className="text-right">بڕ</TableHead>
                    <TableHead className="text-right">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedSalaries.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.month}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">هیچ مووچەیەک نییە</p>
            )}
          </TabsContent>
          
          <TabsContent value="food" className="mt-4">
            <div className="rounded-lg border p-4 mb-4">
              <p className="text-sm text-muted-foreground">کۆی پارەی خواردن:</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totalFoodPayments)}</p>
            </div>
            {loadingFood ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : archivedFoodPayments && archivedFoodPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">مانگ</TableHead>
                    <TableHead className="text-right">بڕ</TableHead>
                    <TableHead className="text-right">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedFoodPayments.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.month}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">هیچ پارەی خواردنێک نییە</p>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>داخستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const fiscalYearFormSchema = z.object({
  year: z.string().min(1, "ساڵ پێویستە").regex(/^\d{4}-\d{4}$/, "فۆرماتی ساڵ دەبێت وەک 2024-2025 بێت"),
  startDate: z.string().min(1, "بەرواری دەستپێک پێویستە"),
  endDate: z.string().min(1, "بەرواری کۆتایی پێویستە"),
  isCurrent: z.boolean().default(true),
});

type FiscalYearFormValues = z.infer<typeof fiscalYearFormSchema>;

function AddYearDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMutation = useCreateFiscalYear();
  
  const currentYear = new Date().getFullYear();
  const defaultYearValue = `${currentYear}-${currentYear + 1}`;
  const defaultStartDate = `${currentYear}-09-01`;
  const defaultEndDate = `${currentYear + 1}-08-31`;
  
  const form = useForm<FiscalYearFormValues>({
    resolver: zodResolver(fiscalYearFormSchema),
    defaultValues: {
      year: defaultYearValue,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      isCurrent: true,
    },
  });

  const onSubmit = async (data: FiscalYearFormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "ساڵی دارایی نوێ زیادکرا" });
      form.reset();
      onClose();
    } catch (err: any) {
      toast({ title: "هەڵە", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>زیادکردنی ساڵی دارایی نوێ</DialogTitle>
          <DialogDescription>
            ساڵی دارایی نوێ دروست بکە بۆ تۆمارکردنی داتای قوتابخانە
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ساڵی دارایی</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="2024-2025" 
                      data-testid="input-fiscal-year"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بەرواری دەستپێک</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        data-testid="input-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بەرواری کۆتایی</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        data-testid="input-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                هەڵوەشاندنەوە
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-fiscal-year">
                {createMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                زیادکردن
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FiscalYearsPage() {
  const { data: fiscalYears, isLoading } = useFiscalYears();
  const { data: currentYear } = useCurrentFiscalYear();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [yearToClose, setYearToClose] = useState<FiscalYear | null>(null);
  const [yearToDelete, setYearToDelete] = useState<FiscalYear | null>(null);
  const [yearToViewArchive, setYearToViewArchive] = useState<FiscalYear | null>(null);
  const { toast } = useToast();
  
  const setCurrentMutation = useSetCurrentFiscalYear();
  const closeMutation = useCloseFiscalYear();
  const deleteMutation = useDeleteFiscalYear();

  const handleSetCurrent = async (year: FiscalYear) => {
    try {
      await setCurrentMutation.mutateAsync(year.id);
      toast({ title: `ساڵی ${year.year} وەک ساڵی ئێستا دانرا` });
    } catch (err: any) {
      toast({ title: "هەڵە", description: err.message, variant: "destructive" });
    }
  };

  const handleCloseYear = async () => {
    if (!yearToClose) return;
    try {
      const result = await closeMutation.mutateAsync(yearToClose.id);
      toast({ 
        title: "ساڵی دارایی داخرا", 
        description: result.message 
      });
      setYearToClose(null);
    } catch (err: any) {
      toast({ title: "هەڵە", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!yearToDelete) return;
    try {
      await deleteMutation.mutateAsync(yearToDelete.id);
      toast({ title: "ساڵی دارایی سڕایەوە" });
      setYearToDelete(null);
    } catch (err: any) {
      toast({ title: "هەڵە", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="بەڕێوەبردنی ساڵی دارایی"
        action={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-fiscal-year">
            <Plus className="ml-2 h-4 w-4" />
            ساڵی نوێ
          </Button>
        }
      />

      {currentYear && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              ساڵی دارایی ئێستا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentYear.year}</div>
            <p className="text-sm text-muted-foreground mt-1">
              هەموو داتای نوێ لەم ساڵەدا تۆمار دەکرێت
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>لیستی ساڵە داراییەکان</CardTitle>
          <CardDescription>
            بەڕێوەبردن و داخستنی ساڵی دارایی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ژ</TableHead>
                <TableHead>ساڵی دارایی</TableHead>
                <TableHead>بارودۆخ</TableHead>
                <TableHead>بەرواری دروستکردن</TableHead>
                <TableHead>بەرواری داخستن</TableHead>
                <TableHead className="w-48">کردارەکان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fiscalYears?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    هیچ ساڵێکی دارایی نییە. تکایە ساڵێکی نوێ زیاد بکە.
                  </TableCell>
                </TableRow>
              )}
              {fiscalYears?.map((year, index) => (
                <TableRow key={year.id} data-testid={`row-fiscal-year-${year.id}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {year.isCurrent && (
                        <Badge variant="default" className="bg-primary">
                          ئێستا
                        </Badge>
                      )}
                      {year.isClosed ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          داخراو
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Unlock className="h-3 w-3" />
                          کراوە
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {year.createdAt ? new Date(year.createdAt).toLocaleDateString('ku') : '-'}
                  </TableCell>
                  <TableCell>
                    {year.closedAt ? new Date(year.closedAt).toLocaleDateString('ku') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {year.isClosed && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setYearToViewArchive(year)}
                          data-testid={`button-view-archive-${year.id}`}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          ئەرشیف
                        </Button>
                      )}
                      {!year.isCurrent && !year.isClosed && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSetCurrent(year)}
                          disabled={setCurrentMutation.isPending}
                          data-testid={`button-set-current-${year.id}`}
                        >
                          <ArrowRight className="h-4 w-4 ml-1" />
                          ئێستا بکە
                        </Button>
                      )}
                      {year.isCurrent && !year.isClosed && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setYearToClose(year)}
                          data-testid={`button-close-year-${year.id}`}
                        >
                          <Lock className="h-4 w-4 ml-1" />
                          داخستن
                        </Button>
                      )}
                      {!year.isClosed && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setYearToDelete(year)}
                          data-testid={`button-delete-year-${year.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddYearDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />

      <AlertDialog open={!!yearToClose} onOpenChange={(open) => !open && setYearToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>داخستنی ساڵی دارایی {yearToClose?.year}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>ئایا دڵنیایت لە داخستنی ئەم ساڵی داراییە؟</p>
              <p className="font-medium text-destructive">ئەم کردارە:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>هەموو قوتابیان بەرز دەکرێنەوە بۆ پۆلی داهاتوو</li>
                <li>قەرزی پارەدانەکانی قوتابیان دەگوازرێتەوە بۆ قەرزی ساڵی پێشوو</li>
                <li>ساڵی داراییەکە داخراو دەبێت و ناتوانرێت بگۆڕدرێت</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                دوای داخستن، پێویستە ساڵی داراییەکی نوێ دروست بکەیت بۆ تۆمارکردنی داتای نوێ.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>هەڵوەشاندنەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseYear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              بەڵێ، داخستن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!yearToDelete} onOpenChange={(open) => !open && setYearToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی ساڵی دارایی {yearToDelete?.year}</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی ئەم ساڵی داراییە؟ ئەم کردارە ناگەڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>هەڵوەشاندنەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ArchiveViewerDialog 
        fiscalYear={yearToViewArchive}
        isOpen={!!yearToViewArchive}
        onClose={() => setYearToViewArchive(null)}
      />
    </div>
  );
}
