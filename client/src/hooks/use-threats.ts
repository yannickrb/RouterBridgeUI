import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useThreats() {
  return useQuery({
    queryKey: [api.threats.list.path],
    queryFn: async () => {
      const res = await fetch(api.threats.list.path);
      if (!res.ok) throw new Error("Failed to fetch threats");
      return res.json();
    },
    refetchInterval: 10000,
  });
}
