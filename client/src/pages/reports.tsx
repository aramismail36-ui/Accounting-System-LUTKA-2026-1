import { useState } from "react";
import { useMonthlyReport, useIncome, useExpenses, usePayments } from "@/hooks/use-finance";
import { useStudents } from "@/hooks/use-students";
import { useStaff } from "@/hooks/use-staff";
import { useSalaryPayments } from "@/hooks/use-salary-payments";
import { useSchoolSettings } from "@/hooks/use-school-settings";
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
  const { data: settings } = useSchoolSettings();
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [expensePeriod, setExpensePeriod] = useState<string>("year");
  
  const schoolName = settings?.schoolName || "قوتابخانەی لوتکەی ناحکومی";
  const logoUrl = settings?.logoUrl || "";

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

  // Export comprehensive PDF using HTML for proper Kurdish text support
  const exportFullReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>ڕاپۆرتی تەواو - قوتابخانەی لوتکە</title>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Vazirmatn', 'Arial', sans-serif; }
          body { direction: rtl; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 20px; }
          .date { text-align: center; margin-bottom: 20px; color: #666; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }
          .summary-card { padding: 15px 25px; border-radius: 8px; text-align: center; min-width: 120px; }
          .income-card { background: #d1fae5; color: #16a34a; }
          .expense-card { background: #fee2e2; color: #dc2626; }
          .profit-card { background: #dbeafe; color: #2563eb; }
          .loss-card { background: #fed7aa; color: #ea580c; }
          .summary-card h3 { font-size: 18px; margin: 5px 0; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; padding: 5px; border-radius: 4px; }
          .income-title { background: #16a34a; color: white; }
          .expense-title { background: #dc2626; color: white; }
          .payment-title { background: #4f46e5; color: white; }
          .staff-title { background: #ea580c; color: white; }
          .salary-title { background: #9333ea; color: white; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; }
          th { background: #f5f5f5; font-weight: 600; }
          .total-row { background: #f0f0f0; font-weight: bold; }
          .amount-green { color: #16a34a; }
          .amount-red { color: #dc2626; }
          .amount-purple { color: #9333ea; }
          .amount-indigo { color: #4f46e5; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; }
          @media print { body { padding: 10px; } .section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 10px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width: 60px; height: 60px; object-fit: contain;" />` : ''}
        </div>
        <h1>${schoolName}</h1>
        <div class="date">ڕاپۆرتی تەواو - ${new Date().toLocaleDateString('ku')}</div>
        
        <div class="summary">
          <div class="summary-card income-card">
            <p>کۆی داهات</p>
            <h3>${totalIncome.toLocaleString()} د.ع</h3>
          </div>
          <div class="summary-card expense-card">
            <p>کۆی خەرجی</p>
            <h3>${totalExpenses.toLocaleString()} د.ع</h3>
          </div>
          <div class="summary-card ${isProfitable ? 'profit-card' : 'loss-card'}">
            <p>${isProfitable ? 'قازانجی سافی' : 'زیان'}</p>
            <h3>${Math.abs(profit).toLocaleString()} د.ع</h3>
          </div>
        </div>

        <div class="section">
          <div class="section-title income-title">داهاتەکان (${income?.length || 0} تۆمار)</div>
          <table>
            <thead><tr><th>ژ</th><th>سەرچاوە</th><th>بڕ (د.ع)</th><th>بەروار</th><th>تێبینی</th></tr></thead>
            <tbody>
              ${income?.map((i, idx) => `<tr><td>${idx + 1}</td><td>${i.source}</td><td class="amount-green">+${Number(i.amount).toLocaleString()}</td><td>${format(new Date(i.date), "yyyy-MM-dd")}</td><td>${i.description || '-'}</td></tr>`).join('') || ''}
              <tr class="total-row"><td></td><td>کۆی گشتی</td><td class="amount-green">${totalIncome.toLocaleString()} د.ع</td><td colspan="2"></td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title expense-title">خەرجییەکان (${expenses?.length || 0} تۆمار)</div>
          <table>
            <thead><tr><th>ژ</th><th>جۆر</th><th>بڕ (د.ع)</th><th>بەروار</th><th>تێبینی</th></tr></thead>
            <tbody>
              ${expenses?.map((e, idx) => `<tr><td>${idx + 1}</td><td>${e.category}</td><td class="amount-red">-${Number(e.amount).toLocaleString()}</td><td>${format(new Date(e.date), "yyyy-MM-dd")}</td><td>${e.description || '-'}</td></tr>`).join('') || ''}
              <tr class="total-row"><td></td><td>کۆی گشتی</td><td class="amount-red">${totalExpenses.toLocaleString()} د.ع</td><td colspan="2"></td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title payment-title">قیستەکان (${payments?.length || 0} تۆمار)</div>
          <table>
            <thead><tr><th>ناوی قوتابی</th><th>بڕ (د.ع)</th><th>بەروار</th></tr></thead>
            <tbody>
              ${payments?.map(p => `<tr><td>${getStudentName(p.studentId)}</td><td class="amount-indigo">${Number(p.amount).toLocaleString()}</td><td>${format(new Date(p.date), "yyyy-MM-dd")}</td></tr>`).join('') || ''}
              <tr class="total-row"><td>کۆی گشتی</td><td class="amount-indigo">${totalPayments.toLocaleString()} د.ع</td><td></td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title staff-title">کارمەندان (${staff?.length || 0} کەس)</div>
          <table>
            <thead><tr><th>ناو</th><th>پلە / کار</th><th>مووچە (د.ع)</th></tr></thead>
            <tbody>
              ${staff?.map(s => `<tr><td>${s.fullName}</td><td>${s.role}</td><td>${Number(s.salary).toLocaleString()}</td></tr>`).join('') || ''}
              <tr class="total-row"><td>کۆی گشتی مووچە</td><td></td><td>${totalStaffSalary.toLocaleString()} د.ع</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title salary-title">مووچەی دراوەکان (${salaryPayments?.length || 0} تۆمار)</div>
          <table>
            <thead><tr><th>کارمەند</th><th>بڕ (د.ع)</th><th>مانگ</th><th>بەروار</th></tr></thead>
            <tbody>
              ${salaryPayments?.map(s => `<tr><td>${getStaffName(s.staffId)}</td><td class="amount-purple">${Number(s.amount).toLocaleString()}</td><td>${s.month}</td><td>${format(new Date(s.date), "yyyy-MM-dd")}</td></tr>`).join('') || ''}
              <tr class="total-row"><td>کۆی گشتی</td><td class="amount-purple">${totalSalaries.toLocaleString()} د.ع</td><td colspan="2"></td></tr>
            </tbody>
          </table>
        </div>

        <div class="footer">چاپکرا لە بەرواری ${new Date().toLocaleDateString()} | بۆ داگرتنی PDF: چاپکردن > وەک PDF پاشەکەوت بکە</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export students PDF using HTML for proper Kurdish text support
  const exportStudentsPDF = () => {
    const filterLabels: { [key: string]: string } = {
      "all": "هەموو قوتابیان",
      "fully_paid": "تەواو دراوە",
      "partially_paid": "بەشێکی دراوە",
      "not_paid": "هیچی نەدراوە"
    };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>ڕاپۆرتی پارەدانی قوتابیان</title>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Vazirmatn', 'Arial', sans-serif; }
          body { direction: rtl; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 20px; }
          .info { text-align: center; margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background: #4f46e5; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f9f9f9; }
          .amount-green { color: #16a34a; }
          .amount-red { color: #dc2626; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 10px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width: 60px; height: 60px; object-fit: contain;" />` : ''}
        </div>
        <h1>${schoolName}</h1>
        <div class="info">
          ڕاپۆرتی پارەدانی قوتابیان | فلتەر: ${filterLabels[paymentFilter]} | کۆی قوتابی: ${filteredStudents.length}
        </div>
        <table>
          <thead>
            <tr>
              <th>ناوی قوتابی</th>
              <th>پۆل</th>
              <th>مۆبایل</th>
              <th>کرێی خوێندن (د.ع)</th>
              <th>پارەی دراو (د.ع)</th>
              <th>ماوە (د.ع)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map(s => `
              <tr>
                <td>${s.fullName}</td>
                <td>${s.grade || '-'}</td>
                <td>${s.mobile}</td>
                <td>${Number(s.tuitionFee).toLocaleString()}</td>
                <td class="amount-green">${Number(s.paidAmount).toLocaleString()}</td>
                <td class="amount-red">${Number(s.remainingAmount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">چاپکرا لە بەرواری ${new Date().toLocaleDateString()} | بۆ داگرتنی PDF: چاپکردن > وەک PDF پاشەکەوت بکە</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
                    <div style="text-align: center; margin-bottom: 10px;">
                      ${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width: 60px; height: 60px; object-fit: contain;" />` : ''}
                    </div>
                    <h1>${schoolName}</h1>
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
                  <TableHead className="text-right w-[60px]">ژ</TableHead>
                  <TableHead className="text-right">ناوی سیانی</TableHead>
                  <TableHead className="text-right">پۆل</TableHead>
                  <TableHead className="text-right">مۆبایل</TableHead>
                  <TableHead className="text-right">کرێی خوێندن (د.ع)</TableHead>
                  <TableHead className="text-right">پارەی دراو (د.ع)</TableHead>
                  <TableHead className="text-right">ماوە (د.ع)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
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
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      <body>
                      <div style="text-align:center;margin-bottom:10px">${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width:50px;height:50px;object-fit:contain" />` : ''}</div>
                      <h1>${schoolName} - داهاتەکان</h1>
                      <table><thead><tr><th>ژ</th><th>سەرچاوە</th><th>بڕ (د.ع)</th><th>بەروار</th><th>تێبینی</th></tr></thead>
                      <tbody>${income?.map((i, idx) => `<tr><td>${idx + 1}</td><td>${i.source}</td><td style="color:#16a34a">+${Number(i.amount).toLocaleString()}</td><td>${format(new Date(i.date), "yyyy-MM-dd")}</td><td>${i.description || "-"}</td></tr>`).join('') || ''}</tbody></table>
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
                      <TableHead className="text-right w-[60px]">ژ</TableHead>
                      <TableHead className="text-right">سەرچاوە</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                      <TableHead className="text-right">تێبینی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income?.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.source}</TableCell>
                        <TableCell className="font-mono text-green-600">+{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(!income || income.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">هیچ تۆمارێک نییە</TableCell>
                      </TableRow>
                    )}
                    {income && income.length > 0 && (
                      <TableRow className="bg-green-100 dark:bg-green-900/40 font-bold">
                        <TableCell></TableCell>
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
                      <body>
                      <div style="text-align:center;margin-bottom:10px">${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width:50px;height:50px;object-fit:contain" />` : ''}</div>
                      <h1>${schoolName} - خەرجییەکان</h1>
                      <table><thead><tr><th>ژ</th><th>جۆر</th><th>بڕ (د.ع)</th><th>بەروار</th><th>تێبینی</th></tr></thead>
                      <tbody>${expenses?.map((e, idx) => `<tr><td>${idx + 1}</td><td>${e.category}</td><td style="color:#dc2626">-${Number(e.amount).toLocaleString()}</td><td>${format(new Date(e.date), "yyyy-MM-dd")}</td><td>${e.description || "-"}</td></tr>`).join('') || ''}</tbody></table>
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
                      <TableHead className="text-right w-[60px]">ژ</TableHead>
                      <TableHead className="text-right">جۆر</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                      <TableHead className="text-right">تێبینی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell className="font-mono text-red-600">-{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(!expenses || expenses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">هیچ تۆمارێک نییە</TableCell>
                      </TableRow>
                    )}
                    {expenses && expenses.length > 0 && (
                      <TableRow className="bg-red-100 dark:bg-red-900/40 font-bold">
                        <TableCell></TableCell>
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
                      <body>
                      <div style="text-align:center;margin-bottom:10px">${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width:50px;height:50px;object-fit:contain" />` : ''}</div>
                      <h1>${schoolName} - قیستەکان</h1>
                      <table><thead><tr><th>ژ</th><th>قوتابی</th><th>بڕ (د.ع)</th><th>بەروار</th></tr></thead>
                      <tbody>${payments?.map((p, idx) => `<tr><td>${idx + 1}</td><td>${getStudentName(p.studentId)}</td><td style="color:#4f46e5">${Number(p.amount).toLocaleString()}</td><td>${format(new Date(p.date), "yyyy-MM-dd")}</td></tr>`).join('') || ''}</tbody></table>
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
                      <TableHead className="text-right w-[60px]">ژ</TableHead>
                      <TableHead className="text-right">قوتابی</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                        <TableCell className="font-medium">{getStudentName(item.studentId)}</TableCell>
                        <TableCell className="font-mono text-indigo-600">{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    {(!payments || payments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">هیچ قیستێک نییە</TableCell>
                      </TableRow>
                    )}
                    {payments && payments.length > 0 && (
                      <TableRow className="bg-indigo-100 dark:bg-indigo-900/40 font-bold">
                        <TableCell></TableCell>
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
                      <body>
                      <div style="text-align:center;margin-bottom:10px">${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width:50px;height:50px;object-fit:contain" />` : ''}</div>
                      <h1>${schoolName} - کارمەندان</h1>
                      <table><thead><tr><th>ژ</th><th>ناو</th><th>پلە</th><th>مۆبایل</th><th>مووچە (د.ع)</th></tr></thead>
                      <tbody>${staff?.map((s, idx) => `<tr><td>${idx + 1}</td><td>${s.fullName}</td><td>${s.role}</td><td>${s.mobile}</td><td>${Number(s.salary).toLocaleString()}</td></tr>`).join('') || ''}</tbody></table>
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
                      <TableHead className="text-right w-[60px]">ژ</TableHead>
                      <TableHead className="text-right">ناو</TableHead>
                      <TableHead className="text-right">پلە</TableHead>
                      <TableHead className="text-right">مۆبایل</TableHead>
                      <TableHead className="text-right">مووچە (د.ع)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff?.map((person, index) => (
                      <TableRow key={person.id}>
                        <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                        <TableCell className="font-medium">{person.fullName}</TableCell>
                        <TableCell>{person.role}</TableCell>
                        <TableCell>{person.mobile}</TableCell>
                        <TableCell className="font-mono">{Number(person.salary).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {(!staff || staff.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">هیچ کارمەندێک نییە</TableCell>
                      </TableRow>
                    )}
                    {staff && staff.length > 0 && (
                      <TableRow className="bg-orange-100 dark:bg-orange-900/40 font-bold">
                        <TableCell></TableCell>
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
                      <body>
                      <div style="text-align:center;margin-bottom:10px">${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width:50px;height:50px;object-fit:contain" />` : ''}</div>
                      <h1>${schoolName} - مووچەکان</h1>
                      <table><thead><tr><th>ژ</th><th>کارمەند</th><th>بڕ (د.ع)</th><th>مانگ</th><th>بەروار</th></tr></thead>
                      <tbody>${salaryPayments?.map((s, idx) => `<tr><td>${idx + 1}</td><td>${getStaffName(s.staffId)}</td><td style="color:#9333ea">${Number(s.amount).toLocaleString()}</td><td>${s.month}</td><td>${format(new Date(s.date), "yyyy-MM-dd")}</td></tr>`).join('') || ''}</tbody></table>
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
                      <TableHead className="text-right w-[60px]">ژ</TableHead>
                      <TableHead className="text-right">کارمەند</TableHead>
                      <TableHead className="text-right">بڕ (د.ع)</TableHead>
                      <TableHead className="text-right">مانگ</TableHead>
                      <TableHead className="text-right">بەروار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryPayments?.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground font-mono">{index + 1}</TableCell>
                        <TableCell className="font-medium">{getStaffName(item.staffId)}</TableCell>
                        <TableCell className="font-mono text-purple-600">{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                      </TableRow>
                    ))}
                    {(!salaryPayments || salaryPayments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">هیچ مووچەیەک نییە</TableCell>
                      </TableRow>
                    )}
                    {salaryPayments && salaryPayments.length > 0 && (
                      <TableRow className="bg-purple-100 dark:bg-purple-900/40 font-bold">
                        <TableCell></TableCell>
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
                            <body>
                            <div style="text-align:center;margin-bottom:10px">${logoUrl ? `<img src="${logoUrl}" alt="لۆگۆ" style="width:50px;height:50px;object-fit:contain" />` : ''}</div>
                            <h1>${schoolName} - خەرجی بەپێی بابەت</h1>
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
                            <TableHead className="text-right w-[60px]">ژ</TableHead>
                            <TableHead className="text-right">بابەت / جۆر</TableHead>
                            <TableHead className="text-right">کۆی خەرجی (د.ع)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryData.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-muted-foreground font-mono">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{item.category}</TableCell>
                              <TableCell className="font-mono text-orange-600">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {categoryData.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">هیچ خەرجییەک لەم ماوەیەدا نییە</TableCell>
                            </TableRow>
                          )}
                          {categoryData.length > 0 && (
                            <TableRow className="bg-orange-100 dark:bg-orange-900/40 font-bold">
                              <TableCell></TableCell>
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
