import { Packet, Device } from "@shared/schema";
import { format } from "date-fns";
import { Globe, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PacketRowProps {
  packet: Packet & { device?: Device | null };
}

export function PacketRow({ packet }: PacketRowProps) {
  const isSuspicious = packet.isSuspicious || packet.status === "Blocked";

  return (
    <div data-testid={`packet-row-${packet.id}`} className={cn(
      "group relative overflow-hidden bg-card border border-white/5 rounded-xl p-4 transition-all hover:bg-white/[0.02]",
      isSuspicious && "border-destructive/30 bg-destructive/[0.02]"
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
            isSuspicious 
              ? "bg-destructive/10 border-destructive/20 text-destructive" 
              : "bg-secondary border-white/5 text-muted-foreground"
          )}>
            {isSuspicious ? <AlertTriangle className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate text-foreground" data-testid={`packet-device-name-${packet.id}`}>
              {packet.device?.name || "Unknown Device"}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span className={cn(
                "uppercase px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[10px] font-bold tracking-wider",
                packet.protocol === "HTTPS" ? "text-green-400" : "text-blue-400"
              )}>
                {packet.protocol}
              </span>
              <span className="font-mono text-xs">{packet.destinationHost || packet.destinationIp}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span data-testid={`packet-status-${packet.id}`} className={cn(
            "text-xs font-medium px-2 py-1 rounded-full mb-1",
            packet.status === "Blocked" && "bg-destructive/10 text-destructive",
            packet.status === "Flagged" && "bg-yellow-500/10 text-yellow-500",
            packet.status === "Allowed" && "bg-green-500/10 text-green-500"
          )}>
            {packet.status}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {format(new Date(packet.timestamp || new Date()), "HH:mm:ss")}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
         <span className="flex items-center gap-1">
           <Shield className="w-3 h-3" />
           {packet.sourceIp}
         </span>
         <span className="font-mono">{packet.size} B</span>
      </div>
    </div>
  );
}
