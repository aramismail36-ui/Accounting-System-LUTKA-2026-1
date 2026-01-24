import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertIncome, type InsertExpense, type InsertPayment } from "@shared/routes";

// --- INCOME ---
export function useIncome() {
  return useQuery({
    queryKey: [api.income.list.path],
    queryFn: async () => {
      const res = await fetch(api.income.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch income");
      return api.income.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertIncome) => {
      const validated = api.income.create.input.parse(data);
      const res = await fetch(api.income.create.path, {
        method: api.income.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create income");
      return api.income.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
    },
  });
}

// --- EXPENSES ---
export function useExpenses() {
  return useQuery({
    queryKey: [api.expenses.list.path],
    queryFn: async () => {
      const res = await fetch(api.expenses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return api.expenses.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      const validated = api.expenses.create.input.parse(data);
      const res = await fetch(api.expenses.create.path, {
        method: api.expenses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
    },
  });
}

// --- PAYMENTS (INSTALLMENTS) ---
export function usePayments() {
  return useQuery({
    queryKey: [api.payments.list.path],
    queryFn: async () => {
      const res = await fetch(api.payments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return api.payments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPayment) => {
      const validated = api.payments.create.input.parse(data);
      const res = await fetch(api.payments.create.path, {
        method: api.payments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create payment");
      return api.payments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.payments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] }); // Students balance updates
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
    },
  });
}

// --- REPORTS ---
export function useMonthlyReport() {
  return useQuery({
    queryKey: [api.reports.monthly.path],
    queryFn: async () => {
      const res = await fetch(api.reports.monthly.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return api.reports.monthly.responses[200].parse(await res.json());
    },
  });
}
