import { useState } from "react";
import { useMonthlyReport, useIncome, useExpenses, usePayments } from "@/hooks/use-finance";
import { useStudents } from "@/hooks/use-students";
import { useStaff } from "@/hooks/use-staff";
import { useSalaryPayments } from "@/hooks/use-salary-payments";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, TrendingDown, Banknote, Printer, FileDown, Users, Wallet, Receipt, CreditCard, BadgeDollarSign, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const { data: report, isLoading } = useMonthlyReport();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: income, isLoading: incomeLoading } = useIncome();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: staff, isLoading: staffLoading } = useStaff();
  const { data: salaryPayments, isLoading: salaryLoading } = useSalaryPayments();
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [expensePeriod, setExpensePeriod] = useState<string>("year");

  const allLoading = isLoading || studentsLoading || incomeLoading || expensesLoading || paymentsLoading || staffLoading || salaryLoading;

  if (allLoading) {
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

  // Calculate totals
  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalSalaries = salaryPayments?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalStaffSalary = staff?.reduce((sum, s) => sum + Number(s.salary), 0) || 0;

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

  // Helper to get student name
  const getStudentName = (id: number) => students?.find(s => s.id === id)?.fullName || "-";
  const getStaffName = (id: number) => staff?.find(s => s.id === id)?.fullName || "-";

  // Export comprehensive PDF
  const exportFullReport = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica");
    let y = 15;

    // Title
    doc.setFontSize(18);
    doc.text("Lutka School - Comprehensive Report", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, y, { align: "center" });
    y += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.text("Financial Summary", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Income: ${totalIncome.toLocaleString()} IQD`, 14, y);
    doc.text(`Total Expenses: ${totalExpenses.toLocaleString()} IQD`, 105, y);
    y += 6;
    doc.text(`Student Payments: ${totalPayments.toLocaleString()} IQD`, 14, y);
    doc.text(`Salary Payments: ${totalSalaries.toLocaleString()} IQD`, 105, y);
    y += 6;
    doc.text(`Net Profit/Loss: ${profit.toLocaleString()} IQD`, 14, y);
    y += 15;

    // Income Table
    doc.setFontSize(12);
    doc.text("Income Records", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Source", "Amount (IQD)", "Date"]],
      body: income?.map(i => [i.source, Number(i.amount).toLocaleString(), format(new Date(i.date), "yyyy-MM-dd")]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Expenses Table
    doc.setFontSize(12);
    doc.text("Expense Records", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount (IQD)", "Date"]],
      body: expenses?.map(e => [e.category, Number(e.amount).toLocaleString(), format(new Date(e.date), "yyyy-MM-dd")]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Check if need new page
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    // Student Payments Table
    doc.setFontSize(12);
    doc.text("Student Payments", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Student", "Amount (IQD)", "Date"]],
      body: payments?.map(p => [getStudentName(p.studentId), Number(p.amount).toLocaleString(), format(new Date(p.date), "yyyy-MM-dd")]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Check if need new page
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    // Staff Table
    doc.setFontSize(12);
    doc.text("Staff Members", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Name", "Role", "Salary (IQD)"]],
      body: staff?.map(s => [s.fullName, s.role, Number(s.salary).toLocaleString()]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Salary Payments Table
    if (y > 250) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(12);
    doc.text("Salary Payments", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Staff", "Amount (IQD)", "Month", "Date"]],
      body: salaryPayments?.map(s => [getStaffName(s.staffId), Number(s.amount).toLocaleString(), s.month, format(new Date(s.date), "yyyy-MM-dd")]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 14, right: 14 }
    });

    doc.save(`lutka-full-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export students PDF
  const exportStudentsPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFont("helvetica");
    doc.setFontSize(18);
    doc.text("Lutka School - Student Payment Report", 148, 15, { align: "center" });
    doc.setFontSize(12);
    const filterText = paymentFilter === "all" ? "All Students" : paymentFilter === "fully_paid" ? "Fully Paid" : paymentFilter === "partially_paid" ? "Partially Paid" : "Not Paid";
    doc.text(`Filter: ${filterText} | Total: ${filteredStudents.length} students`, 148, 25, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 148, 32, { align: "center" });

    autoTable(doc, {
      startY: 40,
      head: [["Name", "Grade", "Mobile", "Tuition Fee", "Paid Amount", "Remaining"]],
      body: filteredStudents.map(s => [s.fullName, s.grade || "-", s.mobile, `${Number(s.tuitionFee).toLocaleString()} IQD`, `${Number(s.paidAmount).toLocaleString()} IQD`, `${Number(s.remainingAmount).toLocaleString()} IQD`]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 }
    });

    doc.save(`student-payments-${paymentFilter}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="ڕاپۆرتەکان"
        description="پوختەی تەواوی زانیاری دارایی قوتابخانە"
        action={
          <div className="flex gap-2">
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
            <Button
              size="lg"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={exportFullReport}
              data-testid="button-export-full-pdf"
            >
              <FileDown className="h-5 w-5" />
              داگرتنی ڕاپۆرتی تەواو (PDF)
            </Button>
          </div>
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
              onClick={exportStudentsPDF}
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

      {/* Detailed Reports Tabs */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>ڕاپۆرتی وردەکاری</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="income" className="gap-2">
                <Wallet className="h-4 w-4" />
                داهاتەکان
              </TabsTrigger>
              <TabsTrigger value="expenses" className="gap-2">
                <Receipt className="h-4 w-4" />
                خەرجییەکان
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                قیستەکان
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2">
                <Users className="h-4 w-4" />
                کارمەندان
              </TabsTrigger>
              <TabsTrigger value="salaries" className="gap-2">
                <BadgeDollarSign className="h-4 w-4" />
                مووچەکان
              </TabsTrigger>
              <TabsTrigger value="expense-categories" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                خەرجی بەپێی بابەت
              </TabsTrigger>
            </TabsList>

            {/* Income Tab */}
            <TabsContent value="income">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">کۆی: {income?.length || 0} تۆمار | {totalIncome.toLocaleString()} د.ع</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="UTF-8"><title>داهاتەکان</title>
                      <style>body{font-family:'Vazirmatn',Arial,sans-serif;direction:rtl;padding:20px}h1{text-align:center;margin-bottom:20px}
                      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:right}
                      th{background:#16a34a;color:white}.total{margin-top:20px;font-weight:bold;text-align:center}
                      .footer{text-align:center;margin-top:30px;font-size:12px;color:#888}</style></head>
                      <body><h1>قوتابخانەی لوتکە - داهاتەکان</h1>
                      <table><thead><tr><th>سەرچاوە</th><th>بڕ (د.ع)</th><th>بەروار</th><th>تێبینی</th></tr></thead>
                      <tbody>${income?.map(i => `<tr><td>${i.source}</td><td style="color:#16a34a">+${Number(i.amount).toLocaleString()}</td><td>${format(new Date(i.date), "yyyy-MM-dd")}</td><td>${i.description || "-"}</td></tr>`).join('') || ''}</tbody></table>
                      <div class="total">کۆی گشتی: ${totalIncome.toLocaleString()} د.ع</div>
                      <div class="footer">چاپکرا لە ${new Date().toLocaleDateString()}</div>
                      <script>window.onload=function(){window.print()}</script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                  data-testid="button-print-income"
                >
                  <Printer className="h-4 w-4" />
                  چاپکردن
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50 dark:bg-green-900/20">
                      <TableHead className="text-right">سەرچاوە</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                      <TableHead className="text-right">تێبینی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.source}</TableCell>
                        <TableCell className="font-mono text-green-600">+{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(!income || income.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">هیچ تۆمارێک نییە</TableCell>
                      </TableRow>
                    )}
                    {income && income.length > 0 && (
                      <TableRow className="bg-green-100 dark:bg-green-900/40 font-bold">
                        <TableCell>کۆی گشتی</TableCell>
                        <TableCell className="font-mono text-green-700 dark:text-green-400">{totalIncome.toLocaleString()} د.ع</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">کۆی: {expenses?.length || 0} تۆمار | {totalExpenses.toLocaleString()} د.ع</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="UTF-8"><title>خەرجییەکان</title>
                      <style>body{font-family:'Vazirmatn',Arial,sans-serif;direction:rtl;padding:20px}h1{text-align:center;margin-bottom:20px}
                      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:right}
                      th{background:#dc2626;color:white}.total{margin-top:20px;font-weight:bold;text-align:center}
                      .footer{text-align:center;margin-top:30px;font-size:12px;color:#888}</style></head>
                      <body><h1>قوتابخانەی لوتکە - خەرجییەکان</h1>
                      <table><thead><tr><th>جۆر</th><th>بڕ (د.ع)</th><th>بەروار</th><th>تێبینی</th></tr></thead>
                      <tbody>${expenses?.map(e => `<tr><td>${e.category}</td><td style="color:#dc2626">-${Number(e.amount).toLocaleString()}</td><td>${format(new Date(e.date), "yyyy-MM-dd")}</td><td>${e.description || "-"}</td></tr>`).join('') || ''}</tbody></table>
                      <div class="total">کۆی گشتی: ${totalExpenses.toLocaleString()} د.ع</div>
                      <div class="footer">چاپکرا لە ${new Date().toLocaleDateString()}</div>
                      <script>window.onload=function(){window.print()}</script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                  data-testid="button-print-expenses"
                >
                  <Printer className="h-4 w-4" />
                  چاپکردن
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-50 dark:bg-red-900/20">
                      <TableHead className="text-right">جۆر</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                      <TableHead className="text-right">تێبینی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell className="font-mono text-red-600">-{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(!expenses || expenses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">هیچ تۆمارێک نییە</TableCell>
                      </TableRow>
                    )}
                    {expenses && expenses.length > 0 && (
                      <TableRow className="bg-red-100 dark:bg-red-900/40 font-bold">
                        <TableCell>کۆی گشتی</TableCell>
                        <TableCell className="font-mono text-red-700 dark:text-red-400">{totalExpenses.toLocaleString()} د.ع</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">کۆی: {payments?.length || 0} قیست | {totalPayments.toLocaleString()} د.ع</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="UTF-8"><title>قیستەکان</title>
                      <style>body{font-family:'Vazirmatn',Arial,sans-serif;direction:rtl;padding:20px}h1{text-align:center;margin-bottom:20px}
                      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:right}
                      th{background:#4f46e5;color:white}.total{margin-top:20px;font-weight:bold;text-align:center}
                      .footer{text-align:center;margin-top:30px;font-size:12px;color:#888}</style></head>
                      <body><h1>قوتابخانەی لوتکە - قیستەکان</h1>
                      <table><thead><tr><th>قوتابی</th><th>بڕ (د.ع)</th><th>بەروار</th></tr></thead>
                      <tbody>${payments?.map(p => `<tr><td>${getStudentName(p.studentId)}</td><td style="color:#4f46e5">${Number(p.amount).toLocaleString()}</td><td>${format(new Date(p.date), "yyyy-MM-dd")}</td></tr>`).join('') || ''}</tbody></table>
                      <div class="total">کۆی گشتی: ${totalPayments.toLocaleString()} د.ع</div>
                      <div class="footer">چاپکرا لە ${new Date().toLocaleDateString()}</div>
                      <script>window.onload=function(){window.print()}</script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                  data-testid="button-print-payments"
                >
                  <Printer className="h-4 w-4" />
                  چاپکردن
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50 dark:bg-indigo-900/20">
                      <TableHead className="text-right">قوتابی</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getStudentName(item.studentId)}</TableCell>
                        <TableCell className="font-mono text-indigo-600">{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    {(!payments || payments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">هیچ قیستێک نییە</TableCell>
                      </TableRow>
                    )}
                    {payments && payments.length > 0 && (
                      <TableRow className="bg-indigo-100 dark:bg-indigo-900/40 font-bold">
                        <TableCell>کۆی گشتی</TableCell>
                        <TableCell className="font-mono text-indigo-700 dark:text-indigo-400">{totalPayments.toLocaleString()} د.ع</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">کۆی: {staff?.length || 0} کارمەند | مووچەی مانگانە: {totalStaffSalary.toLocaleString()} د.ع</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="UTF-8"><title>کارمەندان</title>
                      <style>body{font-family:'Vazirmatn',Arial,sans-serif;direction:rtl;padding:20px}h1{text-align:center;margin-bottom:20px}
                      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:right}
                      th{background:#ea580c;color:white}.total{margin-top:20px;font-weight:bold;text-align:center}
                      .footer{text-align:center;margin-top:30px;font-size:12px;color:#888}</style></head>
                      <body><h1>قوتابخانەی لوتکە - کارمەندان</h1>
                      <table><thead><tr><th>ناو</th><th>پلە</th><th>مۆبایل</th><th>مووچە (د.ع)</th></tr></thead>
                      <tbody>${staff?.map(s => `<tr><td>${s.fullName}</td><td>${s.role}</td><td>${s.mobile}</td><td>${Number(s.salary).toLocaleString()}</td></tr>`).join('') || ''}</tbody></table>
                      <div class="total">کۆی مووچەی مانگانە: ${totalStaffSalary.toLocaleString()} د.ع</div>
                      <div class="footer">چاپکرا لە ${new Date().toLocaleDateString()}</div>
                      <script>window.onload=function(){window.print()}</script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                  data-testid="button-print-staff"
                >
                  <Printer className="h-4 w-4" />
                  چاپکردن
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-orange-50 dark:bg-orange-900/20">
                      <TableHead className="text-right">ناو</TableHead>
                      <TableHead className="text-right">پلە</TableHead>
                      <TableHead className="text-right">مۆبایل</TableHead>
                      <TableHead className="text-right">مووچە (د.ع)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff?.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">{person.fullName}</TableCell>
                        <TableCell>{person.role}</TableCell>
                        <TableCell>{person.mobile}</TableCell>
                        <TableCell className="font-mono">{Number(person.salary).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {(!staff || staff.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">هیچ کارمەندێک نییە</TableCell>
                      </TableRow>
                    )}
                    {staff && staff.length > 0 && (
                      <TableRow className="bg-orange-100 dark:bg-orange-900/40 font-bold">
                        <TableCell>کۆی مووچەی مانگانە</TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell className="font-mono text-orange-700 dark:text-orange-400">{totalStaffSalary.toLocaleString()} د.ع</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Salary Payments Tab */}
            <TabsContent value="salaries">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">کۆی: {salaryPayments?.length || 0} تۆمار | {totalSalaries.toLocaleString()} د.ع</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="UTF-8"><title>مووچەکان</title>
                      <style>body{font-family:'Vazirmatn',Arial,sans-serif;direction:rtl;padding:20px}h1{text-align:center;margin-bottom:20px}
                      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:right}
                      th{background:#9333ea;color:white}.total{margin-top:20px;font-weight:bold;text-align:center}
                      .footer{text-align:center;margin-top:30px;font-size:12px;color:#888}</style></head>
                      <body><h1>قوتابخانەی لوتکە - مووچەکان</h1>
                      <table><thead><tr><th>کارمەند</th><th>بڕ (د.ع)</th><th>مانگ</th><th>بەروار</th></tr></thead>
                      <tbody>${salaryPayments?.map(s => `<tr><td>${getStaffName(s.staffId)}</td><td style="color:#9333ea">${Number(s.amount).toLocaleString()}</td><td>${s.month}</td><td>${format(new Date(s.date), "yyyy-MM-dd")}</td></tr>`).join('') || ''}</tbody></table>
                      <div class="total">کۆی گشتی: ${totalSalaries.toLocaleString()} د.ع</div>
                      <div class="footer">چاپکرا لە ${new Date().toLocaleDateString()}</div>
                      <script>window.onload=function(){window.print()}</script></body></html>
                    `);
                    printWindow.document.close();
                  }}
                  data-testid="button-print-salaries"
                >
                  <Printer className="h-4 w-4" />
                  چاپکردن
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                      <TableHead className="text-right">کارمەند</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">مانگ</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryPayments?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getStaffName(item.staffId)}</TableCell>
                        <TableCell className="font-mono text-purple-600">{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    {(!salaryPayments || salaryPayments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">هیچ مووچەیەک نییە</TableCell>
                      </TableRow>
                    )}
                    {salaryPayments && salaryPayments.length > 0 && (
                      <TableRow className="bg-purple-100 dark:bg-purple-900/40 font-bold">
                        <TableCell>کۆی گشتی</TableCell>
                        <TableCell className="font-mono text-purple-700 dark:text-purple-400">{totalSalaries.toLocaleString()} د.ع</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Expense Categories Tab */}
            <TabsContent value="expense-categories">
              {(() => {
                const now = new Date();
                let startDate: Date;
                switch (expensePeriod) {
                  case "month":
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                  case "3months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    break;
                  case "6months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                    break;
                  case "year":
                  default:
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                }
                
                const filteredExpenses = expenses?.filter(e => new Date(e.date) >= startDate) || [];
                
                const categoryTotals: { [key: string]: number } = {};
                filteredExpenses.forEach(e => {
                  const cat = e.category || "نادیار";
                  categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
                });
                
                const categoryData = Object.entries(categoryTotals)
                  .map(([category, amount]) => ({ category, amount }))
                  .sort((a, b) => b.amount - a.amount);
                
                const grandTotal = categoryData.reduce((sum, c) => sum + c.amount, 0);

                const periodLabels: { [key: string]: string } = {
                  "month": "ئەم مانگە",
                  "3months": "٣ مانگی ڕابردوو",
                  "6months": "٦ مانگی ڕابردوو",
                  "year": "١ ساڵی ڕابردوو",
                };

                return (
                  <>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">ماوە:</span>
                        <Select value={expensePeriod} onValueChange={setExpensePeriod}>
                          <SelectTrigger className="w-[180px]" data-testid="select-expense-period">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month">ئەم مانگە</SelectItem>
                            <SelectItem value="3months">٣ مانگی ڕابردوو</SelectItem>
                            <SelectItem value="6months">٦ مانگی ڕابردوو</SelectItem>
                            <SelectItem value="year">١ ساڵی ڕابردوو</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return;
                          printWindow.document.write(`
                            <!DOCTYPE html><html dir="rtl" lang="ku"><head><meta charset="UTF-8"><title>خەرجی بەپێی بابەت</title>
                            <style>body{font-family:'Vazirmatn',Arial,sans-serif;direction:rtl;padding:20px}h1{text-align:center;margin-bottom:10px}
                            .period{text-align:center;margin-bottom:20px;color:#666}
                            table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:12px;text-align:right}
                            th{background:#ea580c;color:white}.total-row{background:#fed7aa;font-weight:bold}
                            .footer{text-align:center;margin-top:30px;font-size:12px;color:#888}</style></head>
                            <body><h1>قوتابخانەی لوتکە - خەرجی بەپێی بابەت</h1>
                            <div class="period">ماوە: ${periodLabels[expensePeriod]}</div>
                            <table><thead><tr><th>بابەت / جۆر</th><th>کۆی خەرجی (د.ع)</th></tr></thead>
                            <tbody>${categoryData.map(c => `<tr><td>${c.category}</td><td style="color:#ea580c">${c.amount.toLocaleString()}</td></tr>`).join('')}
                            <tr class="total-row"><td>کۆی گشتی</td><td>${grandTotal.toLocaleString()} د.ع</td></tr></tbody></table>
                            <div class="footer">چاپکرا لە ${new Date().toLocaleDateString()}</div>
                            <script>window.onload=function(){window.print()}</script></body></html>
                          `);
                          printWindow.document.close();
                        }}
                        data-testid="button-print-categories"
                      >
                        <Printer className="h-4 w-4" />
                        چاپکردن
                      </Button>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-orange-50 dark:bg-orange-900/20">
                            <TableHead className="text-right">بابەت / جۆر</TableHead>
                            <TableHead className="text-right">کۆی خەرجی (د.ع)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryData.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.category}</TableCell>
                              <TableCell className="font-mono text-orange-600">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {categoryData.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">هیچ خەرجییەک لەم ماوەیەدا نییە</TableCell>
                            </TableRow>
                          )}
                          {categoryData.length > 0 && (
                            <TableRow className="bg-orange-100 dark:bg-orange-900/40 font-bold">
                              <TableCell>کۆی گشتی</TableCell>
                              <TableCell className="font-mono text-orange-700 dark:text-orange-400">{grandTotal.toLocaleString()} د.ع</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
