import { usePackets } from "@/hooks/use-packets";
import { PacketRow } from "@/components/PacketRow";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function Traffic() {
  const { data: packets, isLoading } = usePackets();
  const [search, setSearch] = useState("");

  const suspicious = packets?.filter((p: any) => p.isSuspicious) ?? [];

  const filtered = suspicious.filter((p: any) =>
    !search ||
    p.destinationIp?.includes(search) ||
    p.device?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.protocol?.toLowerCase().includes(search.toLowerCase()) ||
    p.destinationHost?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0 h-full flex flex-col">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-traffic-title">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          Suspicious Traffic
        </h2>
        <p className="text-muted-foreground text-sm">
          Only flagged packets are shown — your normal browsing activity is never recorded.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search IP, device, host, or protocol…"
          className="pl-9 bg-secondary/50 border-white/5 focus:border-primary/50 transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-traffic"
        />
      </div>

      <div className="space-y-3 flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : suspicious.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl space-y-2">
            <ShieldCheck className="w-10 h-10 text-green-500 opacity-60" />
            <p className="text-sm font-medium text-green-500">No suspicious traffic detected</p>
            <p className="text-xs opacity-60">Flagged packets will appear here if rogue activity is found</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl">
            No results match your search
          </div>
        ) : (
          filtered.map((packet: any) => (
            <PacketRow key={packet.id} packet={packet} />
          ))
        )}
      </div>
    </div>
  );
}
