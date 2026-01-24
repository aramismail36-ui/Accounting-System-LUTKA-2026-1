import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertShareholder, type Shareholder } from "@shared/routes";

export function useShareholders() {
  return useQuery({
    queryKey: [api.shareholders.list.path],
    queryFn: async () => {
      const res = await fetch(api.shareholders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shareholders");
      return api.shareholders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateShareholder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertShareholder) => {
      const res = await fetch(api.shareholders.create.path, {
        method: api.shareholders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create shareholder");
      }
      return api.shareholders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shareholders.list.path] }),
  });
}

export function useUpdateShareholder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertShareholder> }) => {
      const url = buildUrl(api.shareholders.update.path, { id });
      const res = await fetch(url, {
        method: api.shareholders.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update shareholder");
      }
      return api.shareholders.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shareholders.list.path] }),
  });
}

export function useDeleteShareholder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.shareholders.delete.path, { id });
      const res = await fetch(url, {
        method: api.shareholders.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete shareholder");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shareholders.list.path] }),
  });
}
