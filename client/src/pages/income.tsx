import { useState } from "react";
import { useIncome, useCreateIncome } from "@/hooks/use-finance";
import { insertIncomeSchema, type InsertIncome } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { format } from "date-fns";

export default function IncomePage() {
  const { data: income, isLoading } = useIncome();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalIncome = income?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="داهاتەکان"
        description="تۆمارکردن و بەڕێوەبردنی سەرچاوەکانی داهات"
        action={
          <Button
            size="lg"
            className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            زیادکردنی داهات
          </Button>
        }
      />

      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">کۆی گشتی داهاتەکان</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {totalIncome.toLocaleString()} د.ع
          </h2>
        </div>
        <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
          <Wallet className="h-8 w-8 text-green-600" />
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
                <TableHead className="text-right">سەرچاوە</TableHead>
                <TableHead className="text-right">بڕ (د.ع)</TableHead>
                <TableHead className="text-right">بەروار</TableHead>
                <TableHead className="text-right">تێبینی</TableHead>
                <TableHead className="text-right w-[100px]">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {income?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.source}</TableCell>
                  <TableCell className="text-green-600 font-bold font-mono">+{Number(item.amount).toLocaleString()} د.ع</TableCell>
                  <TableCell className="text-slate-500 font-mono">
                    {format(new Date(item.date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-slate-500">{item.description || "-"}</TableCell>
                  <TableCell>
                    <DeleteIncomeButton id={item.id} />
                  </TableCell>
                </TableRow>
              ))}
              {income?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    هیچ داهاتێک تۆمار نەکراوە
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateIncomeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

function DeleteIncomeButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.income.delete.path, { id });
      await fetch(url, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.list.path] });
      toast({ title: "سڕایەوە", description: "داهات بە سەرکەوتوویی سڕایەوە" });
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

function CreateIncomeDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateIncome();
  const { toast } = useToast();

  const formSchema = insertIncomeSchema.extend({
    amount: z.coerce.number(),
    date: z.coerce.string(), // date input returns string
  });

  const form = useForm<InsertIncome>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: "",
      amount: 0,
      description: "",
      date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
    },
  });

  function onSubmit(data: InsertIncome) {
    const payload = {
      ...data,
      amount: String(data.amount),
    };
    mutate(payload as any, {
      onSuccess: () => {
        toast({ title: "تۆمارکرا", description: "داهات بە سەرکەوتوویی تۆمارکرا" });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "هەڵە", description: err.message, variant: "destructive" });
      },
    });
  }

  const sources = ["فرۆشتنی جلوبەرگ", "کرێی پاس", "کتێبخانە", "تر"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تۆمارکردنی داهاتی نوێ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سەرچاوە</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="نم: جلوبەرگ..." {...field} list="income-sources" />
                      <datalist id="income-sources">
                        {sources.map(s => <option key={s} value={s} />)}
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
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تۆمارکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
