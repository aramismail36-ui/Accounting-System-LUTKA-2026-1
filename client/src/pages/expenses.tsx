import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/use-finance";
import { insertExpenseSchema, type InsertExpense } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Receipt, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { format } from "date-fns";

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalExpenses = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="خەرجییەکان"
        description="تۆمارکردنی خەرجییەکانی ڕۆژانە و مانگانە"
        action={
          <Button
            size="lg"
            className="gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            زیادکردنی خەرجی
          </Button>
        }
      />

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">کۆی گشتی خەرجییەکان</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            ${totalExpenses.toLocaleString()}
          </h2>
        </div>
        <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
          <Receipt className="h-8 w-8 text-red-600" />
        </div>
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
                <TableHead className="text-right">جۆر / بەش</TableHead>
                <TableHead className="text-right">بڕ (د.ع)</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right">تێبینی</TableHead>
                <TableHead className="text-right w-[100px]">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-red-600 font-bold font-mono">-${Number(item.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-slate-500 font-mono">
                    {format(new Date(item.date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-slate-500">{item.description || "-"}</TableCell>
                  <TableCell>
                    <DeleteExpenseButton id={item.id} />
                  </TableCell>
                </TableRow>
              ))}
              {expenses?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    هیچ خەرجییەک تۆمار نەکراوە
                  </TableCell>
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
      className="text-slate-400 hover:text-red-500"
      disabled={isPending}
      onClick={() => {
        if(confirm("دڵنیای لە سڕینەوە؟")) mutate(id);
      }}
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

  const categories = ["مووچە", "ئاو", "کارەبا", "ئینتەرنێت", "چاککردنەوە", "پاککردنەوە", "سووتەمەنی", "تر"];

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
                        {categories.map(c => <option key={c} value={c} />)}
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
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تۆمارکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
