import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function usePackets() {
  return useQuery({
    queryKey: [api.packets.list.path],
    queryFn: async () => {
      const res = await fetch(api.packets.list.path);
      if (!res.ok) throw new Error("Failed to fetch packets");
      return res.json();
    },
  });
}
