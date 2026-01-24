import { useState } from "react";
import { useStaff, useCreateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { insertStaffSchema, type InsertStaff } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus, Trash2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function StaffPage() {
  const { data: staff, isLoading } = useStaff();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="مامۆستا و فەرمانبەران"
        description="بەڕێوەبردنی میلاکاتی قوتابخانە و مووچە"
        action={
          <Button
            size="lg"
            className="gap-2 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <UserPlus className="h-5 w-5" />
            زیادکردنی کارمەند
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
                <TableHead className="text-right">ناوی سیانی</TableHead>
                <TableHead className="text-right">پلە / کار</TableHead>
                <TableHead className="text-right">مۆبایل</TableHead>
                <TableHead className="text-right">مووچە (د.ع)</TableHead>
                <TableHead className="text-right">کردار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.fullName}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {person.role}
                    </span>
                  </TableCell>
                  <TableCell>{person.mobile}</TableCell>
                  <TableCell className="font-mono font-bold">${Number(person.salary).toLocaleString()}</TableCell>
                  <TableCell>
                    <DeleteStaffButton id={person.id} />
                  </TableCell>
                </TableRow>
              ))}
              {staff?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    هیچ کارمەندێک تۆمار نەکراوە
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateStaffDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

function DeleteStaffButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteStaff();
  const { toast } = useToast();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-400 hover:text-red-600"
      disabled={isPending}
      onClick={() => {
        if (confirm("دڵنیای لە سڕینەوە؟")) {
          mutate(id, {
            onSuccess: () => toast({ title: "سڕایەوە", description: "کارمەند سڕایەوە" }),
          });
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function CreateStaffDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateStaff();
  const { toast } = useToast();

  const formSchema = insertStaffSchema.extend({
    salary: z.coerce.number(),
  });

  const form = useForm<InsertStaff>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      role: "",
      mobile: "",
      salary: 0,
    },
  });

  function onSubmit(data: InsertStaff) {
    const payload = {
      ...data,
      salary: String(data.salary),
    };
    mutate(payload as any, {
      onSuccess: () => {
        toast({ title: "زیادکرا", description: "کارمەندی نوێ زیادکرا" });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "هەڵە", description: err.message, variant: "destructive" });
      },
    });
  }

  const roles = ["مامۆستا", "سەرپەرشتیار", "بەڕێوەبەر", "ژمێریار", "خاوێنکەرەوە", "چێشتلێنەر", "پرسگە"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>زیادکردنی کارمەندی نوێ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ناوی سیانی</FormLabel>
                  <FormControl>
                    <Input placeholder="ناوی تەواو..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پلە / کار</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="هەڵبژێرە..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="0750..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مووچەی مانگانە (د.ع)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              زیادکردن
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
