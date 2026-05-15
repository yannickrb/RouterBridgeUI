import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path);
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

export function useRecentPackets() {
  return useQuery({
    queryKey: [api.packets.recent.path],
    queryFn: async () => {
      const res = await fetch(api.packets.recent.path);
      if (!res.ok) throw new Error("Failed to fetch recent packets");
      return res.json();
    },
    refetchInterval: 2000,
  });
}
