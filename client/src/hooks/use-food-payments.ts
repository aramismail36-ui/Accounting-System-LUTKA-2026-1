import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertFoodPayment, type FoodPayment } from "@shared/routes";

export function useFoodPayments() {
  return useQuery({
    queryKey: [api.foodPayments.list.path],
    queryFn: async () => {
      const res = await fetch(api.foodPayments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch food payments");
      return api.foodPayments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFoodPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFoodPayment) => {
      const res = await fetch(api.foodPayments.create.path, {
        method: api.foodPayments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create food payment");
      }
      return api.foodPayments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.foodPayments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.list.path] });
    },
  });
}

export function useDeleteFoodPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.foodPayments.delete.path, { id });
      const res = await fetch(url, {
        method: api.foodPayments.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete food payment");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.foodPayments.list.path] }),
  });
}
