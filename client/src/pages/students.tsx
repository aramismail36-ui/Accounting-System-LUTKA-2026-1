import { useState, useEffect } from "react";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/use-students";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { insertStudentSchema, type InsertStudent, type Student, api } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Pencil, Trash2, Printer, Loader2, MessageCircle, GraduationCap, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { generatePrintHtml, printDocument } from "@/lib/print-utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function StudentsPage() {
  const { data: students, isLoading } = useStudents();
  const { data: settings } = useSchoolSettings();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  
  // Get unique grades from students
  const uniqueGrades = students 
    ? [...new Set(students.map(s => s.grade).filter(Boolean))].sort((a, b) => {
        const numA = parseInt((a || '').replace(/\D/g, '')) || 999;
        const numB = parseInt((b || '').replace(/\D/g, '')) || 999;
        return numA - numB;
      })
    : [];

  const promoteGradesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.students.promoteGrades.path);
      return res.json();
    },
    onSuccess: (data: { promotedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
      toast({
        title: "پۆلەکان نوێکرانەوە",
        description: `${data.promotedCount} قوتابی گواستنەوە بۆ پۆلی داهاتوو`,
      });
      setIsPromoteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "هەڵە",
        description: "گواستنەوەی پۆل سەرکەوتوو نەبوو",
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const printStudentReceipt = (student: Student) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const logoUrl = settings?.logoUrl || "";
    const schoolName = settings?.schoolName || "قوتابخانەی لوتکەی ناحکومی";
    const schoolAddress = settings?.address || "";
    const schoolPhone = settings?.phone || "";
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="لۆگۆ" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 8px;" />`
      : '';
    
    const previousYearDebt = Number(student.previousYearDebt || 0);
    const totalDebt = Number(student.remainingAmount) + previousYearDebt;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>زانیاری قوتابی - ${student.fullName}</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Vazirmatn', 'Nrt', Arial, sans-serif;
            direction: rtl;
            padding: 10mm;
            font-size: 12px;
          }
          .receipt {
            border: 2px solid #333;
            padding: 15px;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 10px;
            color: #666;
          }
          .receipt-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 12px 0;
            padding: 8px;
            background: #f0f0f0;
            border-radius: 6px;
          }
          .content {
            margin-bottom: 15px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #ccc;
            font-size: 11px;
          }
          .row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            font-weight: bold;
          }
          .financial-section {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            margin-top: 10px;
          }
          .financial-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 11px;
          }
          .paid {
            color: #28a745;
          }
          .remaining {
            color: #dc3545;
          }
          .previous-debt {
            color: #fd7e14;
            background: #fff3cd;
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
          }
          .total-debt {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin-top: 10px;
            padding: 10px;
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
            border-radius: 6px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #888;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${logoHtml}
            <h1>${schoolName}</h1>
            <p>سیستەمی ژمێریاری قوتابخانە</p>
            ${schoolAddress ? `<p style="margin-top: 4px;">📍 ${schoolAddress}</p>` : ''}
            ${schoolPhone ? `<p>📞 ${schoolPhone}</p>` : ''}
          </div>
          
          <div class="receipt-title">زانیاری قوتابی</div>
          <div style="text-align: center; font-size: 10px; margin-bottom: 8px; background: #e8f4f8; padding: 4px; border-radius: 4px;">
            <span style="font-weight: bold;">ژمارەی وەسڵ:</span> STU-${String(student.id).padStart(6, '0')}
          </div>
          
          <div class="content">
            <div class="row">
              <span class="label">ناوی سیانی:</span>
              <span class="value">${student.fullName}</span>
            </div>
            <div class="row">
              <span class="label">پۆل:</span>
              <span class="value">${student.grade || "نەدیاریکراو"}</span>
            </div>
            <div class="row">
              <span class="label">ژمارەی مۆبایل:</span>
              <span class="value">${student.mobile}</span>
            </div>
            <div class="row">
              <span class="label">بەرواری تۆمارکردن:</span>
              <span class="value">${new Date(student.createdAt).toLocaleDateString('ku-Arab')}</span>
            </div>
          </div>
          
          <div class="financial-section">
            <div class="financial-row">
              <span class="label">کرێی خوێندن:</span>
              <span class="value">${Number(student.tuitionFee).toLocaleString()} د.ع</span>
            </div>
            <div class="financial-row paid">
              <span class="label">پارەی دراو:</span>
              <span class="value">${Number(student.paidAmount).toLocaleString()} د.ع</span>
            </div>
            <div class="financial-row remaining">
              <span class="label">ماوەی ئەم ساڵ:</span>
              <span class="value">${Number(student.remainingAmount).toLocaleString()} د.ع</span>
            </div>
            ${previousYearDebt > 0 ? `
            <div class="financial-row previous-debt">
              <span class="label">قەرزی ساڵی پێشوو:</span>
              <span class="value">${previousYearDebt.toLocaleString()} د.ع</span>
            </div>
            ` : ''}
          </div>
          
          ${totalDebt > 0 ? `
          <div class="total-debt">
            کۆی گشتی قەرز: ${totalDebt.toLocaleString()} د.ع
          </div>
          ` : ''}
          
          <div class="footer">
            <p>بەروار: ${new Date().toLocaleDateString('ku-Arab')}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="قوتابیان"
        description="بەڕێوەبردنی زانیاری قوتابیان و کرێی خوێندن"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                const html = generatePrintHtml({
                  title: "لیستی قوتابیان",
                  settings,
                  tableHeaders: ["ژ", "ناوی سیانی", "پۆل", "مۆبایل", "کرێی خوێندن (د.ع)", "پارەی دراو (د.ع)", "ماوە (د.ع)", "قەرزی پار (د.ع)"],
                  tableRows: filteredStudents?.map((s, i) => [
                    String(i + 1),
                    s.fullName,
                    s.grade || '-',
                    s.mobile,
                    Number(s.tuitionFee).toLocaleString(),
                    Number(s.paidAmount).toLocaleString(),
                    Number(s.remainingAmount).toLocaleString(),
                    Number(s.previousYearDebt || 0) > 0 ? Number(s.previousYearDebt).toLocaleString() : "-"
                  ]) || []
                });
                printDocument(html);
              }}
              data-testid="button-print-students"
            >
              <Printer className="h-5 w-5" />
              چاپکردن
            </Button>
            <AlertDialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-orange-500 text-orange-600"
                  data-testid="button-promote-grades"
                >
                  <GraduationCap className="h-5 w-5" />
                  گواستنەوەی پۆل
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>گواستنەوەی پۆلی قوتابیان</AlertDialogTitle>
                  <AlertDialogDescription>
                    ئایا دڵنیایت دەتەوێت گشت قوتابیان بگوازیتەوە بۆ پۆلی داهاتوو؟
                    <br /><br />
                    نموونە: پۆلی ١ دەبێتە پۆلی ٢، پۆلی ٢ دەبێتە پۆلی ٣، و هتد.
                    <br /><br />
                    <strong className="text-orange-600">ئەم کارە ناگەڕێتەوە!</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel data-testid="button-cancel-promote">پاشگەزبوونەوە</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => promoteGradesMutation.mutate()}
                    disabled={promoteGradesMutation.isPending}
                    className="bg-orange-600"
                    data-testid="button-confirm-promote"
                  >
                    {promoteGradesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : null}
                    بەڵێ، گواستنەوە بکە
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              size="lg"
              className="gap-2 bg-primary shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
              onClick={() => {
                setEditingStudent(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
              زیادکردنی قوتابی
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-xl">
          <CardContent className="p-6">
            <p className="text-blue-100 font-medium">کۆی گشتی قوتابیان</p>
            <h3 className="text-3xl font-bold mt-2">{students?.length || 0}</h3>
          </CardContent>
        </Card>
        {/* Add more stats if needed */}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="گەڕان بەدوای قوتابی..."
              className="pr-10 h-12 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-students"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[180px] h-12 rounded-xl" data-testid="select-grade-filter">
                <SelectValue placeholder="فلتەرکردن بە پۆل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-grade-all">هەموو پۆلەکان</SelectItem>
                {uniqueGrades.map(grade => (
                  <SelectItem key={grade} value={grade || ''} data-testid={`option-grade-${grade}`}>
                    پۆلی {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {gradeFilter !== "all" && (
            <div className="text-sm text-muted-foreground">
              ({filteredStudents?.length || 0} قوتابی لە پۆلی {gradeFilter})
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead className="text-right font-bold w-[60px]">ژ</TableHead>
                  <TableHead className="text-right font-bold">ناوی سیانی</TableHead>
                  <TableHead className="text-right font-bold">پۆل</TableHead>
                  <TableHead className="text-right font-bold">ژمارەی مۆبایل</TableHead>
                  <TableHead className="text-right font-bold">کرێی خوێندن</TableHead>
                  <TableHead className="text-right font-bold text-green-600">واصل کراو</TableHead>
                  <TableHead className="text-right font-bold text-red-600">ماوە</TableHead>
                  <TableHead className="text-right font-bold text-orange-600">قەرزی پار</TableHead>
                  <TableHead className="text-right font-bold">ڕێکەوت و کات</TableHead>
                  <TableHead className="text-right font-bold">کردارەکان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      هیچ قوتابیەک نەدۆزرایەوە
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents?.map((student, index) => (
                    <TableRow key={student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.mobile}</TableCell>
                      <TableCell className="font-mono text-slate-600">{Number(student.tuitionFee).toLocaleString()} د.ع</TableCell>
                      <TableCell className="font-mono text-green-600 font-medium">{Number(student.paidAmount).toLocaleString()} د.ع</TableCell>
                      <TableCell className="font-mono text-red-600 font-medium">{Number(student.remainingAmount).toLocaleString()} د.ع</TableCell>
                      <TableCell className="font-mono text-orange-600 font-medium">
                        {Number(student.previousYearDebt || 0) > 0 
                          ? `${Number(student.previousYearDebt).toLocaleString()} د.ع`
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-mono">
                        {new Date(student.createdAt).toLocaleString('ku-Arab', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditingStudent(student);
                              setIsDialogOpen(true);
                            }}
                            data-testid={`button-edit-student-${student.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => printStudentReceipt(student)}
                            data-testid={`button-print-student-${student.id}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {Number(student.remainingAmount) > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-green-600 hover:bg-green-50"
                              onClick={() => {
                                const phone = student.mobile.replace(/^0/, "964");
                                const remaining = Number(student.remainingAmount).toLocaleString();
                                const message = `بەخێوکاری بەڕێز، تکایە سەردانی بەشی ژمێریاری قوتابخانە بکە بۆ پێدانی قیستی منداڵەکەت (${student.fullName})، چونکە ئێستا کاتی پێدانی قیستی قوتابخانەیە. سوپاس بۆ هاوکاریتان\nقوتابخانەی لوتکەی ناحکومی`;
                                const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                                window.open(url, "_blank");
                              }}
                              data-testid={`button-whatsapp-student-${student.id}`}
                              title="ناردنی بیرهێنانەوە بە واتس ئەپ"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <DeleteStudentButton id={student.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        student={editingStudent}
      />
    </div>
  );
}

function DeleteStudentButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteStudent();
  const { toast } = useToast();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-500 hover:text-red-600 hover:bg-red-50"
      disabled={isPending}
      onClick={() => {
        if (confirm("دڵنیای لە سڕینەوەی ئەم قوتابیە؟")) {
          mutate(id, {
            onSuccess: () => toast({ title: "سڕایەوە", description: "قوتابی بە سەرکەوتوویی سڕایەوە" }),
          });
        }
      }}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

function StudentDialog({ open, onOpenChange, student }: { open: boolean, onOpenChange: (open: boolean) => void, student: Student | null }) {
  const { mutate: create, isPending: isCreating } = useCreateStudent();
  const { mutate: update, isPending: isUpdating } = useUpdateStudent();
  const { toast } = useToast();

  // Custom schema to handle string-to-number coercion for form inputs
  const formSchema = insertStudentSchema.extend({
    tuitionFee: z.coerce.number(),
    paidAmount: z.coerce.number().default(0),
    remainingAmount: z.coerce.number().default(0),
  });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      grade: "",
      tuitionFee: 0,
      paidAmount: 0,
      remainingAmount: 0,
    },
  });

  // Reset form when dialog opens/closes or edit target changes
  useEffect(() => {
    if (open && student) {
      form.reset({
        fullName: student.fullName,
        mobile: student.mobile,
        grade: student.grade || "",
        tuitionFee: Number(student.tuitionFee),
        paidAmount: Number(student.paidAmount),
        remainingAmount: Number(student.remainingAmount),
      });
    } else if (open && !student) {
      form.reset({
        fullName: "",
        mobile: "",
        grade: "",
        tuitionFee: 0,
        paidAmount: 0,
        remainingAmount: 0,
      });
    }
  }, [open, student, form]);

  // Calculate remaining automatically
  const tuition = form.watch("tuitionFee");
  const paid = form.watch("paidAmount");

  // Effect to update remaining amount field
  // NOTE: In a real app, this logic might be better handled by just submitting tuition and paid, and letting backend calc remaining
  // But for better UX, we show it here.
  const remaining = Math.max(0, (tuition || 0) - (paid || 0));

  function onSubmit(data: InsertStudent) {
    // Convert numbers to strings for decimal fields (required by schema)
    const payload = {
      fullName: data.fullName,
      mobile: data.mobile,
      grade: data.grade || "",
      tuitionFee: String(data.tuitionFee),
      paidAmount: String(data.paidAmount),
      remainingAmount: String(remaining),
    };

    if (student) {
      update({ id: student.id, ...payload }, {
        onSuccess: () => {
          toast({ title: "نوێکرایەوە", description: "زانیاری قوتابی نوێکرایەوە" });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: "هەڵە", description: err.message, variant: "destructive" });
        },
      });
    } else {
      create(payload as any, {
        onSuccess: () => {
          toast({ title: "زیادکرا", description: "قوتابی نوێ زیادکرا" });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: "هەڵە", description: err.message, variant: "destructive" });
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{student ? "دەستکاری قوتابی" : "زیادکردنی قوتابی نوێ"}</DialogTitle>
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
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ژمارەی مۆبایل</FormLabel>
                  <FormControl>
                    <Input placeholder="0750..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پۆل</FormLabel>
                  <FormControl>
                    <Input placeholder="پۆلی یەکەم، دووەم..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tuitionFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کرێی خوێندن (د.ع)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بڕی واصل (د.ع)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">بڕی ماوە:</span>
              <span className="text-xl font-bold text-red-600 font-mono">{remaining.toLocaleString()} د.ع</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isCreating || isUpdating} className="w-full sm:w-auto">
                {isCreating || isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {student ? "نوێکردنەوە" : "زیادکردن"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
