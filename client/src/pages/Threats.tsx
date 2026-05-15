import { useThreats } from "@/hooks/use-threats";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Ban, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function BlockDeviceButton({ deviceId, deviceName, isBlocked }: { deviceId: number; deviceName: string; isBlocked: boolean }) {
  const { toast } = useToast();

  const blockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/devices/${deviceId}/block`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Device Blocked", description: `${deviceName} has been blocked from the network.` });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/devices/${deviceId}/unblock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Device Unblocked", description: `${deviceName} has been unblocked.` });
    },
  });

  if (isBlocked) {
    return (
      <Button
        variant="outline"
        className="flex-1 md:flex-none border-green-500/30 text-green-500"
        onClick={() => unblockMutation.mutate()}
        disabled={unblockMutation.isPending}
        data-testid={`button-unblock-device-${deviceId}`}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        {unblockMutation.isPending ? "Unblocking..." : "Unblock"}
      </Button>
    );
  }

  return (
    <Button
      variant="destructive"
      className="flex-1 md:flex-none shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      onClick={() => blockMutation.mutate()}
      disabled={blockMutation.isPending}
      data-testid={`button-block-device-${deviceId}`}
    >
      <Ban className="w-4 h-4 mr-2" />
      {blockMutation.isPending ? "Blocking..." : "Block Device"}
    </Button>
  );
}

export default function Threats() {
  const { data: threats, isLoading } = useThreats();

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-destructive" data-testid="text-threats-title">Detected Threats</h2>
        <p className="text-muted-foreground text-sm">High priority security alerts from your WiFi network.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : threats?.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center bg-card border border-white/5 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Network Secure</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">No active threats detected on your WiFi network.</p>
          </div>
        ) : (
          threats?.map((threat: any, idx: number) => {
            const device = threat.packet?.device;
            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                data-testid={`card-threat-${threat.id}`}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-6 transition-all",
                  threat.severity === "Critical" ? "bg-destructive/5 border-destructive/30" : "bg-card border-white/10",
                  "hover:border-destructive/50"
                )}
              >
                {threat.severity === "Critical" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-4 md:pl-0">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                        threat.severity === "Critical" ? "bg-destructive text-white border-destructive" :
                        threat.severity === "High" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      )}>
                        {threat.severity}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(threat.detectedAt || new Date()), "MMM dd, HH:mm")}
                      </span>
                      {device?.isBlocked && (
                        <span className="px-2 py-0.5 rounded text-xs font-mono border bg-destructive/10 text-destructive border-destructive/20">
                          Device Blocked
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground">{threat.type}</h3>
                    <p className="text-muted-foreground text-sm max-w-2xl">{threat.description}</p>
                    
                    {threat.packet && (
                      <div className="bg-black/40 rounded-lg p-3 text-xs font-mono space-y-1 mt-4 inline-block border border-white/5">
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">Device:</span>
                          <span className="text-foreground">{device?.name || "Unknown"}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">Source IP:</span>
                          <span className="text-foreground">{threat.packet.sourceIp}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">Dest:</span>
                          <span className="text-foreground">{threat.packet.destinationHost || threat.packet.destinationIp}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 shrink-0">
                    {device && (
                      <BlockDeviceButton
                        deviceId={device.id}
                        deviceName={device.name}
                        isBlocked={device.isBlocked || false}
                      />
                    )}
                    <Button variant="outline" className="flex-1 md:flex-none border-white/10" data-testid={`button-ignore-${threat.id}`}>
                      Ignore
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
