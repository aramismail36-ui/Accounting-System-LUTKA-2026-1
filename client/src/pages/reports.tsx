import { useMonthlyReport } from "@/hooks/use-finance";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Banknote, Printer } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function ReportsPage() {
  const { data: report, isLoading } = useMonthlyReport();

  if (isLoading) {
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
    </div>
  );
}
