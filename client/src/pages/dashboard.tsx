import { useStudents } from "@/hooks/use-students";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { Staff, Income, Expense } from "@shared/schema";

export default function DashboardPage() {
  const { data: students, isLoading: studentsLoading } = useStudents();
  
  const { data: staff } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });
  
  const { data: income } = useQuery<Income[]>({
    queryKey: ["/api/income"],
  });
  
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const totalStudents = students?.length || 0;
  const totalTeachers = staff?.filter(s => s.role?.includes("مامۆستا") || s.role?.includes("معلم")).length || 0;
  const totalStaff = staff?.length || 0;
  
  const totalIncomeReceived = students?.reduce((sum, s) => sum + Number(s.paidAmount), 0) || 0;
  const totalIncomeRemaining = students?.reduce((sum, s) => sum + Number(s.remainingAmount), 0) || 0;
  const totalSchoolIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  
  const gradeData: { [key: string]: number } = {};
  students?.forEach(student => {
    const grade = student.grade || "نادیار";
    gradeData[grade] = (gradeData[grade] || 0) + 1;
  });
  
  const chartData = Object.entries(gradeData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 999;
      const numB = parseInt(b.name.replace(/\D/g, '')) || 999;
      return numA - numB;
    });

  const COLORS = ['#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const netBalance = totalIncomeReceived + totalSchoolIncome - totalExpenses;

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبۆرد"
        description="پوختەی زانیاری قوتابخانە"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">کۆی قوتابیان</CardTitle>
            <GraduationCap className="h-5 w-5 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">قوتابی تۆمارکراو</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">کۆی کارمەندان</CardTitle>
            <Users className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">مامۆستا: {totalTeachers}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">پارەی وەرگیراو</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIncomeReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">د.ع لە قوتابیان</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">پارەی ماوە</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalIncomeRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">د.ع نەدراو</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">کۆی داهاتی قوتابخانە</CardTitle>
            <Wallet className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{totalSchoolIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">د.ع داهاتی تر</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">کۆی خەرجییەکان</CardTitle>
            <TrendingDown className="h-5 w-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">د.ع خەرجکراو</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">باڵانسی تەواو</CardTitle>
            <PiggyBank className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">د.ع (داهات - خەرجی)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              ژمارەی قوتابیان بەپێی پۆل
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} قوتابی`, 'ژمارە']}
                      contentStyle={{ borderRadius: '8px', direction: 'rtl' }}
                    />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                هیچ قوتابیەک نییە
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              دابەشکردنی قوتابیان بەپێی پۆل
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} قوتابی`, 'ژمارە']}
                      contentStyle={{ borderRadius: '8px', direction: 'rtl' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                هیچ قوتابیەک نییە
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>ژمارەی قوتابیان بەپێی پۆل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {chartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '4px' }}
              >
                <span className="font-medium">{item.name}</span>
                <span 
                  className="text-xl font-bold"
                  style={{ color: COLORS[index % COLORS.length] }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {chartData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              هیچ قوتابیەک نییە
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
