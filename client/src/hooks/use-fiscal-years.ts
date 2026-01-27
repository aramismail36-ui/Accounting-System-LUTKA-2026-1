import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertFiscalYear, type FiscalYear } from "@shared/routes";

export function useFiscalYears() {
  return useQuery({
    queryKey: [api.fiscalYears.list.path],
    queryFn: async () => {
      const res = await fetch(api.fiscalYears.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fiscal years");
      return res.json() as Promise<FiscalYear[]>;
    },
  });
}

export function useCurrentFiscalYear() {
  return useQuery({
    queryKey: [api.fiscalYears.current.path],
    queryFn: async () => {
      const res = await fetch(api.fiscalYears.current.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch current fiscal year");
      return res.json() as Promise<FiscalYear | null>;
    },
  });
}

export function useCreateFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFiscalYear) => {
      const res = await fetch(api.fiscalYears.create.path, {
        method: api.fiscalYears.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create fiscal year");
      }
      return res.json() as Promise<FiscalYear>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.current.path] });
    },
  });
}

export function useSetCurrentFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.fiscalYears.setCurrent.path, { id });
      const res = await fetch(url, {
        method: api.fiscalYears.setCurrent.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to set current fiscal year");
      }
      return res.json() as Promise<FiscalYear>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.current.path] });
    },
  });
}

export function useCloseFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.fiscalYears.closeYear.path, { id });
      const res = await fetch(url, {
        method: api.fiscalYears.closeYear.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to close fiscal year");
      }
      return res.json() as Promise<{ success: boolean; message: string; promotedStudents: number; newYear: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.current.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
  });
}

export function useDeleteFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.fiscalYears.delete.path, { id });
      const res = await fetch(url, {
        method: api.fiscalYears.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete fiscal year");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.fiscalYears.current.path] });
    },
  });
}
