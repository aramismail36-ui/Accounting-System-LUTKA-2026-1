import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertSchoolSettings, type SchoolSettings } from "@shared/routes";

export function useSchoolSettings() {
  return useQuery({
    queryKey: [api.schoolSettings.get.path],
    queryFn: async () => {
      const res = await fetch(api.schoolSettings.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.schoolSettings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSchoolSettings) => {
      const res = await fetch(api.schoolSettings.update.path, {
        method: api.schoolSettings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.schoolSettings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.schoolSettings.get.path] }),
  });
}
