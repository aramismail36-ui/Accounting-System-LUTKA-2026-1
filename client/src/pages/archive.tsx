import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFiscalYears } from "@/hooks/use-fiscal-years";
import { type FiscalYear, type Income, type Expense, type Payment, type SalaryPayment, type FoodPayment, type Student, type Staff } from "@shared/routes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Loader2, DollarSign, Receipt, Users, Utensils, Wallet } from "lucide-react";
import { useSchoolSettings } from "@/hooks/use-school-settings";

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US').format(num) + ' د.ع';
}

function printArchiveSection(title: string, content: string, schoolName?: string | null, logoUrl?: string | null) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; margin-bottom: 10px;" />` : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ku">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
        body {
          font-family: 'Vazirmatn', sans-serif;
          padding: 20px;
          direction: rtl;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 10px 0;
          font-size: 24px;
        }
        .header h2 {
          margin: 5px 0;
          font-size: 18px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #333;
          padding: 8px 12px;
          text-align: right;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .total-row {
          font-weight: bold;
          background-color: #e8f5e9;
        }
        .print-date {
          text-align: left;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoHtml}
        <h1>${schoolName || 'قوتابخانە'}</h1>
        <h2>${title}</h2>
      </div>
      ${content}
      <div class="print-date">بەرواری چاپ: ${new Date().toLocaleDateString('ku')}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

export default function ArchivePage() {
  const { data: fiscalYears, isLoading: loadingYears } = useFiscalYears();
  const { data: settings } = useSchoolSettings();
  const [selectedYear, setSelectedYear] = useState<string>("");
  
  const closedYears = fiscalYears?.filter(y => y.isClosed) || [];

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: staffList } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  const { data: archivedIncome, isLoading: loadingIncome } = useQuery<Income[]>({
    queryKey: ['/api/archive', selectedYear, 'income'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${selectedYear}/income`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!selectedYear,
  });

  const { data: archivedExpenses, isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ['/api/archive', selectedYear, 'expenses'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${selectedYear}/expenses`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!selectedYear,
  });

  const { data: archivedPayments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ['/api/archive', selectedYear, 'payments'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${selectedYear}/payments`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!selectedYear,
  });

  const { data: archivedSalaries, isLoading: loadingSalaries } = useQuery<SalaryPayment[]>({
    queryKey: ['/api/archive', selectedYear, 'salary-payments'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${selectedYear}/salary-payments`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!selectedYear,
  });

  const { data: archivedFoodPayments, isLoading: loadingFood } = useQuery<FoodPayment[]>({
    queryKey: ['/api/archive', selectedYear, 'food-payments'],
    queryFn: async () => {
      const res = await fetch(`/api/archive/${selectedYear}/food-payments`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!selectedYear,
  });

  const getStudentName = (studentId: number) => {
    const student = students?.find(s => s.id === studentId);
    return student?.fullName || `قوتابی ${studentId}`;
  };

  const getStaffName = (staffId: number) => {
    const staff = staffList?.find(s => s.id === staffId);
    return staff?.fullName || `کارمەند ${staffId}`;
  };

  const totalIncome = archivedIncome?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = archivedExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalPayments = archivedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalSalaries = archivedSalaries?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalFoodPayments = archivedFoodPayments?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;

  const handlePrintIncome = () => {
    if (!archivedIncome) return;
    const rows = archivedIncome.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.source}</td>
        <td>${item.description || '-'}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.date}</td>
      </tr>
    `).join('');
    const content = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>سەرچاوە</th>
            <th>تێبینی</th>
            <th>بڕ</th>
            <th>بەروار</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3">کۆی گشتی</td>
            <td colspan="2">${formatCurrency(totalIncome)}</td>
          </tr>
        </tbody>
      </table>
    `;
    printArchiveSection(`داهاتەکانی ساڵی ${selectedYear}`, content, settings?.schoolName, settings?.logoUrl);
  };

  const handlePrintExpenses = () => {
    if (!archivedExpenses) return;
    const rows = archivedExpenses.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.category}</td>
        <td>${item.description || '-'}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.date}</td>
      </tr>
    `).join('');
    const content = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>جۆر</th>
            <th>تێبینی</th>
            <th>بڕ</th>
            <th>بەروار</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3">کۆی گشتی</td>
            <td colspan="2">${formatCurrency(totalExpenses)}</td>
          </tr>
        </tbody>
      </table>
    `;
    printArchiveSection(`خەرجییەکانی ساڵی ${selectedYear}`, content, settings?.schoolName, settings?.logoUrl);
  };

  const handlePrintPayments = () => {
    if (!archivedPayments) return;
    const rows = archivedPayments.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${getStudentName(item.studentId)}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.date}</td>
      </tr>
    `).join('');
    const content = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ناوی قوتابی</th>
            <th>بڕ</th>
            <th>بەروار</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="2">کۆی گشتی</td>
            <td colspan="2">${formatCurrency(totalPayments)}</td>
          </tr>
        </tbody>
      </table>
    `;
    printArchiveSection(`پارەدانەکانی قوتابیان - ساڵی ${selectedYear}`, content, settings?.schoolName, settings?.logoUrl);
  };

  const handlePrintSalaries = () => {
    if (!archivedSalaries) return;
    const rows = archivedSalaries.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${getStaffName(item.staffId)}</td>
        <td>${item.month}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.date}</td>
        <td>${item.notes || '-'}</td>
      </tr>
    `).join('');
    const content = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ناوی کارمەند</th>
            <th>مانگ</th>
            <th>بڕ</th>
            <th>بەرواری پارەدان</th>
            <th>تێبینی</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3">کۆی گشتی</td>
            <td colspan="3">${formatCurrency(totalSalaries)}</td>
          </tr>
        </tbody>
      </table>
    `;
    printArchiveSection(`مووچەکان - ساڵی ${selectedYear}`, content, settings?.schoolName, settings?.logoUrl);
  };

  const handlePrintFoodPayments = () => {
    if (!archivedFoodPayments) return;
    const rows = archivedFoodPayments.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${getStudentName(item.studentId)}</td>
        <td>${item.month}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.date}</td>
        <td>${item.notes || '-'}</td>
      </tr>
    `).join('');
    const content = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ناوی قوتابی</th>
            <th>مانگ</th>
            <th>بڕ</th>
            <th>بەرواری پارەدان</th>
            <th>تێبینی</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3">کۆی گشتی</td>
            <td colspan="3">${formatCurrency(totalFoodPayments)}</td>
          </tr>
        </tbody>
      </table>
    `;
    printArchiveSection(`پارەی خواردن - ساڵی ${selectedYear}`, content, settings?.schoolName, settings?.logoUrl);
  };

  if (loadingYears) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ئەرشیفی ساڵە پێشووەکان"
        description="بینین و چاپکردنی زانیارییەکانی ساڵە داراییە داخراوەکان"
      />

      <Card>
        <CardHeader>
          <CardTitle>هەڵبژاردنی ساڵی دارایی</CardTitle>
          <CardDescription>ساڵێک هەڵبژێرە بۆ بینینی ئەرشیفەکەی</CardDescription>
        </CardHeader>
        <CardContent>
          {closedYears.length === 0 ? (
            <p className="text-muted-foreground">هیچ ساڵێکی داراییی داخراو نییە.</p>
          ) : (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full max-w-xs" data-testid="select-archive-year">
                <SelectValue placeholder="ساڵی دارایی هەڵبژێرە..." />
              </SelectTrigger>
              <SelectContent>
                {closedYears.map((year) => (
                  <SelectItem key={year.id} value={year.year}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedYear && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="income" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="income" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  داهات
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex items-center gap-1">
                  <Receipt className="h-4 w-4" />
                  خەرجی
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  پارەدان
                </TabsTrigger>
                <TabsTrigger value="salaries" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  مووچە
                </TabsTrigger>
                <TabsTrigger value="food" className="flex items-center gap-1">
                  <Utensils className="h-4 w-4" />
                  خواردن
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="income" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground">کۆی داهات:</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                  <Button onClick={handlePrintIncome} disabled={!archivedIncome?.length} data-testid="button-print-income">
                    <Printer className="h-4 w-4 ml-2" />
                    چاپکردن
                  </Button>
                </div>
                {loadingIncome ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : archivedIncome && archivedIncome.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">#</TableHead>
                        <TableHead className="text-right">سەرچاوە</TableHead>
                        <TableHead className="text-right">تێبینی</TableHead>
                        <TableHead className="text-right">بڕ</TableHead>
                        <TableHead className="text-right">بەروار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedIncome.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.source}</TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                          <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">هیچ داهاتێک نییە</p>
                )}
              </TabsContent>
              
              <TabsContent value="expenses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-muted-foreground">کۆی خەرجی:</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <Button onClick={handlePrintExpenses} disabled={!archivedExpenses?.length} data-testid="button-print-expenses">
                    <Printer className="h-4 w-4 ml-2" />
                    چاپکردن
                  </Button>
                </div>
                {loadingExpenses ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : archivedExpenses && archivedExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">#</TableHead>
                        <TableHead className="text-right">جۆر</TableHead>
                        <TableHead className="text-right">تێبینی</TableHead>
                        <TableHead className="text-right">بڕ</TableHead>
                        <TableHead className="text-right">بەروار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedExpenses.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                          <TableCell className="text-red-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">هیچ خەرجییەک نییە</p>
                )}
              </TabsContent>
              
              <TabsContent value="payments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                    <p className="text-sm text-muted-foreground">کۆی پارەدانی قوتابیان:</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPayments)}</p>
                  </div>
                  <Button onClick={handlePrintPayments} disabled={!archivedPayments?.length} data-testid="button-print-payments">
                    <Printer className="h-4 w-4 ml-2" />
                    چاپکردن
                  </Button>
                </div>
                {loadingPayments ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : archivedPayments && archivedPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">#</TableHead>
                        <TableHead className="text-right">ناوی قوتابی</TableHead>
                        <TableHead className="text-right">بڕ</TableHead>
                        <TableHead className="text-right">بەروار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedPayments.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{getStudentName(item.studentId)}</TableCell>
                          <TableCell className="text-blue-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">هیچ پارەدانێک نییە</p>
                )}
              </TabsContent>
              
              <TabsContent value="salaries" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="rounded-lg border p-4 bg-purple-50 dark:bg-purple-950">
                    <p className="text-sm text-muted-foreground">کۆی مووچە:</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSalaries)}</p>
                  </div>
                  <Button onClick={handlePrintSalaries} disabled={!archivedSalaries?.length} data-testid="button-print-salaries">
                    <Printer className="h-4 w-4 ml-2" />
                    چاپکردن
                  </Button>
                </div>
                {loadingSalaries ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : archivedSalaries && archivedSalaries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">#</TableHead>
                        <TableHead className="text-right">ناوی کارمەند</TableHead>
                        <TableHead className="text-right">مانگ</TableHead>
                        <TableHead className="text-right">بڕ</TableHead>
                        <TableHead className="text-right">بەرواری پارەدان</TableHead>
                        <TableHead className="text-right">تێبینی</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedSalaries.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{getStaffName(item.staffId)}</TableCell>
                          <TableCell>{item.month}</TableCell>
                          <TableCell className="text-purple-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">هیچ مووچەیەک نییە</p>
                )}
              </TabsContent>
              
              <TabsContent value="food" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="rounded-lg border p-4 bg-orange-50 dark:bg-orange-950">
                    <p className="text-sm text-muted-foreground">کۆی پارەی خواردن:</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalFoodPayments)}</p>
                  </div>
                  <Button onClick={handlePrintFoodPayments} disabled={!archivedFoodPayments?.length} data-testid="button-print-food">
                    <Printer className="h-4 w-4 ml-2" />
                    چاپکردن
                  </Button>
                </div>
                {loadingFood ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : archivedFoodPayments && archivedFoodPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">#</TableHead>
                        <TableHead className="text-right">ناوی قوتابی</TableHead>
                        <TableHead className="text-right">مانگ</TableHead>
                        <TableHead className="text-right">بڕ</TableHead>
                        <TableHead className="text-right">بەرواری پارەدان</TableHead>
                        <TableHead className="text-right">تێبینی</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedFoodPayments.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{getStudentName(item.studentId)}</TableCell>
                          <TableCell>{item.month}</TableCell>
                          <TableCell className="text-orange-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">هیچ پارەی خواردنێک نییە</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
