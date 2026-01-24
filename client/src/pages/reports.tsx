import { useState } from "react";
import { useMonthlyReport } from "@/hooks/use-finance";
import { useStudents } from "@/hooks/use-students";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, TrendingDown, Banknote, Printer, FileDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ReportsPage() {
  const { data: report, isLoading } = useMonthlyReport();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  if (isLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const chartData = [
    { name: 'داهات', value: report?.totalIncome || 0, color: '#16a34a' },
    { name: 'خەرجی', value: report?.totalExpenses || 0, color: '#dc2626' },
  ];

  const profit = report?.netProfit || 0;
  const isProfitable = profit >= 0;

  // Filter students by payment status
  const filteredStudents = students?.filter(student => {
    const paid = Number(student.paidAmount);
    const total = Number(student.tuitionFee);
    const remaining = Number(student.remainingAmount);
    
    switch (paymentFilter) {
      case "fully_paid":
        return remaining === 0 && total > 0;
      case "partially_paid":
        return paid > 0 && remaining > 0;
      case "not_paid":
        return paid === 0;
      default:
        return true;
    }
  }) || [];

  // Export to PDF function
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Add Kurdish font support (using built-in fonts for now)
    doc.setFont("helvetica");
    
    // Title
    doc.setFontSize(18);
    doc.text("Lutka School - Student Payment Report", 148, 15, { align: "center" });
    
    // Filter info
    doc.setFontSize(12);
    const filterText = paymentFilter === "all" ? "All Students" :
                       paymentFilter === "fully_paid" ? "Fully Paid" :
                       paymentFilter === "partially_paid" ? "Partially Paid" : "Not Paid";
    doc.text(`Filter: ${filterText} | Total: ${filteredStudents.length} students`, 148, 25, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 148, 32, { align: "center" });

    // Table data
    const tableData = filteredStudents.map(s => [
      s.fullName,
      s.grade || "-",
      s.mobile,
      `${Number(s.tuitionFee).toLocaleString()} IQD`,
      `${Number(s.paidAmount).toLocaleString()} IQD`,
      `${Number(s.remainingAmount).toLocaleString()} IQD`
    ]);

    // Add table
    (doc as any).autoTable({
      startY: 40,
      head: [["Name", "Grade", "Mobile", "Tuition Fee", "Paid Amount", "Remaining"]],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 }
    });

    // Save the PDF
    doc.save(`student-payments-${paymentFilter}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="ڕاپۆرتی مانگانە"
        description={`پوختەی دارایی بۆ مانگی: ${report?.month || "..."}`}
        action={
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl" lang="ku">
                <head>
                  <meta charset="UTF-8">
                  <title>ڕاپۆرتی مانگانە</title>
                  <style>
                    body { font-family: 'Vazirmatn', Arial, sans-serif; direction: rtl; padding: 20px; }
                    h1 { text-align: center; margin-bottom: 10px; }
                    .month { text-align: center; margin-bottom: 30px; color: #666; }
                    .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .card { padding: 20px; border-radius: 10px; text-align: center; min-width: 150px; }
                    .income { background: #d1fae5; color: #16a34a; }
                    .expense { background: #fee2e2; color: #dc2626; }
                    .profit { background: #dbeafe; color: #2563eb; }
                    .loss { background: #fed7aa; color: #ea580c; }
                    .card h3 { font-size: 24px; margin: 10px 0; }
                    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #888; }
                  </style>
                </head>
                <body>
                  <h1>قوتابخانەی لوتکەی ناحکومی</h1>
                  <div class="month">ڕاپۆرتی مانگی: ${report?.month || "..."}</div>
                  <div class="summary">
                    <div class="card income">
                      <p>کۆی داهات</p>
                      <h3>${report?.totalIncome.toLocaleString()} د.ع</h3>
                    </div>
                    <div class="card expense">
                      <p>کۆی خەرجی</p>
                      <h3>${report?.totalExpenses.toLocaleString()} د.ع</h3>
                    </div>
                    <div class="card ${isProfitable ? 'profit' : 'loss'}">
                      <p>${isProfitable ? 'قازانجی سافی' : 'زیان'}</p>
                      <h3>${Math.abs(profit).toLocaleString()} د.ع</h3>
                    </div>
                  </div>
                  <div class="footer">چاپکرا لە بەرواری ${new Date().toLocaleDateString()}</div>
                  <script>window.onload = function() { window.print(); }</script>
                </body>
                </html>
              `);
              printWindow.document.close();
            }}
            data-testid="button-print-report"
          >
            <Printer className="h-5 w-5" />
            چاپکردن
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-medium">کۆی داهات</p>
                <h3 className="text-3xl font-bold mt-1">{report?.totalIncome.toLocaleString()} د.ع</h3>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 font-medium">کۆی خەرجی</p>
                <h3 className="text-3xl font-bold mt-1">{report?.totalExpenses.toLocaleString()} د.ع</h3>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-lg text-white ${isProfitable ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isProfitable ? 'text-blue-100' : 'text-orange-100'} font-medium`}>
                  {isProfitable ? 'قازانجی سافی' : 'زیان'}
                </p>
                <h3 className="text-3xl font-bold mt-1">{Math.abs(profit).toLocaleString()} د.ع</h3>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Banknote className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>شیکردنەوەی داهات و خەرجی</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()} د.ع`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg flex flex-col justify-center items-center p-6 text-center">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">تێبینی گرنگ</h3>
            <p className="text-muted-foreground max-w-sm">
              ئەم داتایانە تەنها بۆ مانگی ئێستا هەژمار کراون. بۆ بینینی داتای مانگەکانی پێشوو، تکایە سەردانی ئەرشیف بکە.
            </p>
        </Card>
      </div>

      {/* Student Payment Report Section */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>ڕاپۆرتی پارەدانی قوتابیان</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-payment-filter">
                <SelectValue placeholder="هەموو قوتابیان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو قوتابیان</SelectItem>
                <SelectItem value="fully_paid">تەواو دراوە</SelectItem>
                <SelectItem value="partially_paid">بەشێکی دراوە</SelectItem>
                <SelectItem value="not_paid">هیچی نەدراوە</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={exportToPDF}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              data-testid="button-export-pdf"
            >
              <FileDown className="h-4 w-4" />
              داگرتنی PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            کۆی قوتابیان: {filteredStudents.length}
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead className="text-right">ناوی سیانی</TableHead>
                  <TableHead className="text-right">پۆل</TableHead>
                  <TableHead className="text-right">مۆبایل</TableHead>
                  <TableHead className="text-right">کرێی خوێندن (د.ع)</TableHead>
                  <TableHead className="text-right">پارەی دراو (د.ع)</TableHead>
                  <TableHead className="text-right">ماوە (د.ع)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.grade || "-"}</TableCell>
                    <TableCell>{student.mobile}</TableCell>
                    <TableCell className="font-mono">{Number(student.tuitionFee).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-green-600">{Number(student.paidAmount).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-red-600">{Number(student.remainingAmount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      هیچ قوتابیەک نەدۆزرایەوە
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
