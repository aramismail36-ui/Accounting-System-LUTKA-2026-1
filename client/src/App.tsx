import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutShell } from "@/components/layout-shell";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import DashboardPage from "@/pages/dashboard";
import SchoolSettingsPage from "@/pages/school-settings";
import StudentsPage from "@/pages/students";
import IncomePage from "@/pages/income";
import ExpensesPage from "@/pages/expenses";
import PaymentsPage from "@/pages/payments";
import StaffPage from "@/pages/staff";
import SalaryPaymentsPage from "@/pages/salary-payments";
import FoodPaymentsPage from "@/pages/food-payments";
import ShareholdersPage from "@/pages/shareholders";
import ReportsPage from "@/pages/reports";
import UsersPage from "@/pages/users";
import FiscalYearsPage from "@/pages/fiscal-years";
import ArchivePage from "@/pages/archive";
import LoginPage from "@/pages/login";
import ShareholderDashboardPage from "@/pages/shareholder-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'shareholder') {
    return <ShareholderDashboardPage />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <ShareholderDashboardPage />;
  }

  return (
    <LayoutShell>
      <Component />
    </LayoutShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/school-settings" component={() => <ProtectedRoute component={SchoolSettingsPage} />} />
      <Route path="/students" component={() => <ProtectedRoute component={StudentsPage} />} />
      <Route path="/income" component={() => <ProtectedRoute component={IncomePage} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={ExpensesPage} />} />
      <Route path="/payments" component={() => <ProtectedRoute component={PaymentsPage} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={StaffPage} />} />
      <Route path="/salary-payments" component={() => <ProtectedRoute component={SalaryPaymentsPage} />} />
      <Route path="/food-payments" component={() => <ProtectedRoute component={FoodPaymentsPage} />} />
      <Route path="/shareholders" component={() => <ProtectedRoute component={ShareholdersPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} adminOnly />} />
      <Route path="/fiscal-years" component={() => <ProtectedRoute component={FiscalYearsPage} adminOnly />} />
      <Route path="/archive" component={() => <ProtectedRoute component={ArchivePage} adminOnly />} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
