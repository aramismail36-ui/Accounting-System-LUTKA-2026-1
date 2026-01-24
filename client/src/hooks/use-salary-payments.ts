import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertSalaryPayment, type SalaryPayment } from "@shared/routes";

export function useSalaryPayments() {
  return useQuery({
    queryKey: [api.salaryPayments.list.path],
    queryFn: async () => {
      const res = await fetch(api.salaryPayments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch salary payments");
      return api.salaryPayments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSalaryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSalaryPayment) => {
      const res = await fetch(api.salaryPayments.create.path, {
        method: api.salaryPayments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create salary payment");
      return api.salaryPayments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.salaryPayments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
    },
  });
}

export function useDeleteSalaryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.salaryPayments.delete.path, { id });
      const res = await fetch(url, {
        method: api.salaryPayments.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete salary payment");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.salaryPayments.list.path] }),
  });
}
