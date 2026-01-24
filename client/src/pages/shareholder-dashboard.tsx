import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncome, useExpenses } from "@/hooks/use-finance";
import { useShareholders } from "@/hooks/use-shareholders";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, TrendingDown, Calculator, PieChart, Printer, LogOut, Building } from "lucide-react";

const formatCurrency = (amount: number) => `${amount.toLocaleString()} د.ع`;

export default function ShareholderDashboardPage() {
  const { user, logout } = useAuth();
  const { data: income, isLoading: incomeLoading } = useIncome();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: shareholders, isLoading: shareholdersLoading } = useShareholders();

  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const netProfit = totalIncome - totalExpenses;
  const isProfitable = netProfit >= 0;

  const isLoading = incomeLoading || expensesLoading || shareholdersLoading;

  const getShareAmount = (percentage: number) => {
    return (netProfit * percentage) / 100;
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>ڕاپۆرتی قازانج و زیان</title>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Vazirmatn', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { padding: 20mm; direction: rtl; background: white; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; font-weight: 700; color: #0891b2; }
          .header p { font-size: 14px; color: #666; margin-top: 5px; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; justify-content: center; }
          .summary-item { text-align: center; padding: 15px 25px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
          .summary-label { font-size: 12px; color: #666; }
          .summary-value { font-size: 18px; font-weight: 700; margin-top: 5px; }
          .profit { color: #16a34a; }
          .loss { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
          th { background: #f1f5f9; font-weight: 600; }
          .total-row { background: #f1f5f9; font-weight: 600; }
          .date { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ڕاپۆرتی قازانج و زیان</h1>
          <p>بۆ خاوەن پشکەکان</p>
        </div>
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">کۆی داهات</div>
            <div class="summary-value profit">${formatCurrency(totalIncome)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">کۆی خەرجی</div>
            <div class="summary-value loss">${formatCurrency(totalExpenses)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">${isProfitable ? 'قازانجی سافی' : 'زیانی سافی'}</div>
            <div class="summary-value ${isProfitable ? 'profit' : 'loss'}">${formatCurrency(Math.abs(netProfit))}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ژ</th>
              <th>ناوی پشکدار</th>
              <th>مۆبایل</th>
              <th>ڕێژەی پشک</th>
              <th>بڕی ${isProfitable ? 'قازانج' : 'زیان'}</th>
            </tr>
          </thead>
          <tbody>
            ${shareholders?.map((s, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${s.fullName}</td>
                <td>${s.mobile}</td>
                <td>%${Number(s.sharePercentage).toFixed(2)}</td>
                <td class="${getShareAmount(Number(s.sharePercentage)) >= 0 ? 'profit' : 'loss'}">
                  ${formatCurrency(Math.abs(getShareAmount(Number(s.sharePercentage))))}
                </td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        <div class="date">بەرواری چاپ: ${new Date().toLocaleDateString('ku-Arab')}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">داشبۆردی خاوەن پشکەکان</h1>
            <p className="text-muted-foreground">بینینی قازانج و زیان</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={printReport} data-testid="button-print-shareholder-report">
            <Printer className="ml-2 h-4 w-4" />
            چاپکردن
          </Button>
          <Button variant="ghost" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="ml-2 h-4 w-4" />
            چوونەدەرەوە
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-income">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">کۆی داهات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-income">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-expenses">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">کۆی خەرجی</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className={isProfitable ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} data-testid="card-net-profit">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">
              {isProfitable ? 'قازانجی سافی' : 'زیانی سافی'}
            </CardTitle>
            <Calculator className={`h-4 w-4 ${isProfitable ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-profit">
              {formatCurrency(Math.abs(netProfit))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-shareholders-count">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">ژمارەی پشکداران</CardTitle>
            <PieChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-shareholders-count">
              {shareholders?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            دابەشکردنی قازانج و زیان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-12">ژ</TableHead>
                <TableHead className="text-right">ناوی پشکدار</TableHead>
                <TableHead className="text-right">مۆبایل</TableHead>
                <TableHead className="text-right">ڕێژەی پشک</TableHead>
                <TableHead className="text-right">بڕی {isProfitable ? 'قازانج' : 'زیان'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareholders?.map((shareholder, index) => {
                const amount = getShareAmount(Number(shareholder.sharePercentage));
                return (
                  <TableRow key={shareholder.id} data-testid={`row-shareholder-${shareholder.id}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{shareholder.fullName}</TableCell>
                    <TableCell>{shareholder.mobile}</TableCell>
                    <TableCell>%{Number(shareholder.sharePercentage).toFixed(2)}</TableCell>
                    <TableCell className={amount >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {formatCurrency(Math.abs(amount))}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!shareholders || shareholders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    هیچ پشکدارێک نییە
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        چوونەژوورەوە وەک: {user?.firstName} {user?.lastName} ({user?.email})
      </div>
    </div>
  );
}
