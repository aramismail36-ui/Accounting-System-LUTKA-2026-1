import { useState, useEffect } from "react";
import { useShareholders, useCreateShareholder, useUpdateShareholder, useDeleteShareholder } from "@/hooks/use-shareholders";
import { useIncome, useExpenses } from "@/hooks/use-finance";
import { type Shareholder } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, UserPlus, Trash2, Loader2, Printer, Edit, TrendingUp, TrendingDown, Calculator, PieChart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function ShareholdersPage() {
  const { data: shareholders, isLoading } = useShareholders();
  const { data: income } = useIncome();
  const { data: expenses } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);

  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const netProfit = totalIncome - totalExpenses;
  const isProfitable = netProfit >= 0;

  const totalShares = shareholders?.reduce((sum, s) => sum + Number(s.sharePercentage), 0) || 0;

  const getShareAmount = (percentage: number) => {
    return (netProfit * percentage) / 100;
  };

  const handleEdit = (shareholder: Shareholder) => {
    setEditingShareholder(shareholder);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingShareholder(null);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>دابەشکردنی قازانج و زیان</title>
        <style>
          body { font-family: 'Vazirmatn', Arial, sans-serif; direction: rtl; padding: 20px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .summary { text-align: center; margin-bottom: 20px; font-size: 18px; padding: 15px; background: #f0f0f0; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .profit { color: #16a34a; font-weight: bold; }
          .loss { color: #dc2626; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #333; padding: 10px; text-align: right; }
          th { background: #6366f1; color: white; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <h1>قوتابخانەی لوتکەی ناحکومی - دابەشکردنی قازانج بەسەر پشکداران</h1>
        <div class="summary">
          <div class="summary-row"><span>کۆی داهات:</span><span class="profit">${totalIncome.toLocaleString()} د.ع</span></div>
          <div class="summary-row"><span>کۆی خەرجی:</span><span class="loss">${totalExpenses.toLocaleString()} د.ع</span></div>
          <div class="summary-row"><span>${isProfitable ? 'قازانجی تەواو:' : 'زیانی تەواو:'}</span><span class="${isProfitable ? 'profit' : 'loss'}">${Math.abs(netProfit).toLocaleString()} د.ع</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ژ</th>
              <th>ناوی پشکدار</th>
              <th>مۆبایل</th>
              <th>ڕێژەی پشک (%)</th>
              <th>بڕی ${isProfitable ? 'قازانج' : 'زیان'} (د.ع)</th>
              <th>تێبینی</th>
            </tr>
          </thead>
          <tbody>
            ${shareholders?.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.fullName}</td>
                <td>${s.mobile}</td>
                <td>${Number(s.sharePercentage)}%</td>
                <td class="${isProfitable ? 'profit' : 'loss'}">${Math.abs(getShareAmount(Number(s.sharePercentage))).toLocaleString()}</td>
                <td>${s.notes || '-'}</td>
              </tr>
            `).join('') || ''}
            <tr style="background: #e0e0e0; font-weight: bold;">
              <td></td>
              <td>کۆی گشتی</td>
              <td></td>
              <td>${totalShares}%</td>
              <td class="${isProfitable ? 'profit' : 'loss'}">${Math.abs(netProfit).toLocaleString()}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">چاپکرا لە بەرواری ${new Date().toLocaleDateString()}</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="خاوەن پشکەکان"
        description="دابەشکردنی قازانج و زیان بەپێی پشکەکان"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={printReport}
              data-testid="button-print-shareholders"
            >
              <Printer className="h-5 w-5" />
              چاپکردن
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-shareholder"
            >
              <UserPlus className="h-5 w-5" />
              زیادکردنی پشکدار
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">کۆی داهات</p>
              <p className="text-xl font-bold text-green-600">{totalIncome.toLocaleString()} د.ع</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">کۆی خەرجی</p>
              <p className="text-xl font-bold text-red-600">{totalExpenses.toLocaleString()} د.ع</p>
            </div>
          </div>
        </div>
        <div className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border-2 ${isProfitable ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isProfitable ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <Calculator className={`h-5 w-5 ${isProfitable ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isProfitable ? 'قازانجی تەواو' : 'زیانی تەواو'}</p>
              <p className={`text-xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(netProfit).toLocaleString()} د.ع</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">کۆی پشکەکان</p>
              <p className={`text-xl font-bold ${totalShares === 100 ? 'text-green-600' : 'text-amber-600'}`}>{totalShares}%</p>
            </div>
          </div>
        </div>
      </div>

      {totalShares !== 100 && shareholders && shareholders.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-200">
          <p className="font-medium">ئاگاداری: کۆی پشکەکان {totalShares}% یە و دەبێت 100% بێت بۆ دابەشکردنی دروست.</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[60px]">ژ</TableHead>
                <TableHead className="text-right">ناوی پشکدار</TableHead>
                <TableHead className="text-right">مۆبایل</TableHead>
                <TableHead className="text-right">ڕێژەی پشک</TableHead>
                <TableHead className="text-right">بڕی {isProfitable ? 'قازانج' : 'زیان'}</TableHead>
                <TableHead className="text-right">تێبینی</TableHead>
                <TableHead className="text-right">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareholders?.map((shareholder, index) => {
                const shareAmount = getShareAmount(Number(shareholder.sharePercentage));
                return (
                  <TableRow key={shareholder.id} data-testid={`row-shareholder-${shareholder.id}`}>
                    <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                    <TableCell className="font-medium">{shareholder.fullName}</TableCell>
                    <TableCell>{shareholder.mobile}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        {Number(shareholder.sharePercentage)}%
                      </span>
                    </TableCell>
                    <TableCell className={`font-mono font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfitable ? '+' : '-'}{Math.abs(shareAmount).toLocaleString()} د.ع
                    </TableCell>
                    <TableCell className="text-muted-foreground">{shareholder.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-indigo-600"
                          onClick={() => handleEdit(shareholder)}
                          data-testid={`button-edit-shareholder-${shareholder.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteShareholderButton id={shareholder.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {shareholders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    هیچ پشکدارێک تۆمار نەکراوە
                  </TableCell>
                </TableRow>
              )}
              {shareholders && shareholders.length > 0 && (
                <TableRow className="bg-indigo-100 dark:bg-indigo-900/40 font-bold">
                  <TableCell></TableCell>
                  <TableCell>کۆی گشتی</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-mono text-indigo-700 dark:text-indigo-400">{totalShares}%</TableCell>
                  <TableCell className={`font-mono ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfitable ? '+' : '-'}{Math.abs(netProfit).toLocaleString()} د.ع
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ShareholderDialog 
        open={isDialogOpen} 
        onOpenChange={handleCloseDialog} 
        editingShareholder={editingShareholder}
      />
    </div>
  );
}

function DeleteShareholderButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteShareholder();
  const { toast } = useToast();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-400 hover:text-red-600"
      disabled={isPending}
      onClick={() => {
        if (confirm("دڵنیای لە سڕینەوەی ئەم پشکدارە؟")) {
          mutate(id, {
            onSuccess: () => toast({ title: "سڕایەوە", description: "پشکدار سڕایەوە" }),
          });
        }
      }}
      data-testid={`button-delete-shareholder-${id}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function ShareholderDialog({ 
  open, 
  onOpenChange, 
  editingShareholder 
}: { 
  open: boolean; 
  onOpenChange: () => void; 
  editingShareholder: Shareholder | null;
}) {
  const { mutate: createMutate, isPending: isCreating } = useCreateShareholder();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateShareholder();
  const { toast } = useToast();

  const formSchema = z.object({
    fullName: z.string().min(1, "ناو پێویستە"),
    mobile: z.string().min(1, "مۆبایل پێویستە"),
    sharePercentage: z.coerce.number().min(0.01, "ڕێژەی پشک پێویستە زیاتر لە 0 بێت").max(100, "ڕێژەی پشک ناتوانێت زیاتر لە 100 بێت"),
    notes: z.string().optional().nullable(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: editingShareholder?.fullName || "",
      mobile: editingShareholder?.mobile || "",
      sharePercentage: editingShareholder ? Number(editingShareholder.sharePercentage) : 0,
      notes: editingShareholder?.notes || "",
    },
  });

  useEffect(() => {
    if (editingShareholder) {
      form.reset({
        fullName: editingShareholder.fullName,
        mobile: editingShareholder.mobile,
        sharePercentage: Number(editingShareholder.sharePercentage),
        notes: editingShareholder.notes || "",
      });
    } else {
      form.reset({
        fullName: "",
        mobile: "",
        sharePercentage: 0,
        notes: "",
      });
    }
  }, [editingShareholder, form]);

  function onSubmit(data: FormValues) {
    const payload = {
      ...data,
      sharePercentage: String(data.sharePercentage),
    };

    if (editingShareholder) {
      updateMutate({ id: editingShareholder.id, data: payload as any }, {
        onSuccess: () => {
          toast({ title: "نوێکرایەوە", description: "زانیاریەکانی پشکدار نوێکرایەوە" });
          form.reset();
          onOpenChange();
        },
        onError: (err) => {
          toast({ title: "هەڵە", description: err.message, variant: "destructive" });
        },
      });
    } else {
      createMutate(payload as any, {
        onSuccess: () => {
          toast({ title: "زیادکرا", description: "پشکداری نوێ زیادکرا" });
          form.reset();
          onOpenChange();
        },
        onError: (err) => {
          toast({ title: "هەڵە", description: err.message, variant: "destructive" });
        },
      });
    }
  }

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingShareholder ? 'دەستکاری پشکدار' : 'زیادکردنی پشکداری نوێ'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ناوی تەواو</FormLabel>
                  <FormControl>
                    <Input placeholder="ناوی پشکدار..." {...field} data-testid="input-shareholder-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مۆبایل</FormLabel>
                  <FormControl>
                    <Input placeholder="0750..." {...field} data-testid="input-shareholder-mobile" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sharePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ڕێژەی پشک (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="25" {...field} data-testid="input-shareholder-percentage" />
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
                    <Textarea placeholder="تێبینی ئارەزوومەندانە..." {...field} value={field.value || ''} data-testid="input-shareholder-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending} data-testid="button-submit-shareholder">
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {editingShareholder ? 'نوێکردنەوە' : 'زیادکردن'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
