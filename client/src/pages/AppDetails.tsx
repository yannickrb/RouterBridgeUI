import { useDevice } from "@/hooks/use-apps";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, Shield, Globe, Clock, Laptop, Smartphone, HardDrive, Ban, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function getDeviceIcon(type: string) {
  switch (type) {
    case "Phone":  return Smartphone;
    case "Laptop": return Laptop;
    case "IoT":    return HardDrive;
    default:       return Wifi;
  }
}

export default function DeviceDetails() {
  const [, params] = useRoute("/devices/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: device, isLoading } = useDevice(id);
  const { toast } = useToast();

  const blockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/devices/${id}/block`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices/:id", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Device Blocked", description: `${device?.name} has been blocked from the network.` });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/devices/${id}/unblock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices/:id", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Device Unblocked", description: `${device?.name} has been unblocked.` });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading device details...</div>;
  }

  if (!device) {
    return <div className="p-8 text-center text-destructive">Device not found</div>;
  }

  const DeviceIcon = getDeviceIcon(device.type);
  const isBlocked = device.isBlocked;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/devices">
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="text-xl font-bold">Device Details</h2>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="w-24 h-24 bg-secondary rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl shrink-0">
            <DeviceIcon className="w-10 h-10 text-muted-foreground" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-device-detail-name">{device.name}</h1>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-mono border",
                device.isAuthorized
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              )}>
                {device.isAuthorized ? "Authorized" : "Unauthorized"}
              </span>
              {isBlocked && (
                <span className="px-2 py-0.5 rounded text-xs font-mono border bg-destructive/10 text-destructive border-destructive/20" data-testid="badge-blocked">
                  Blocked
                </span>
              )}
            </div>
            <p className="text-muted-foreground font-mono">{device.macAddress}</p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <Globe className="w-4 h-4 text-primary" />
                IP: {device.ipAddress}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <Shield className="w-4 h-4 text-primary" />
                Risk Score: {device.riskScore ?? 0}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <Clock className="w-4 h-4" />
                {device.lastSeen ? format(new Date(device.lastSeen), "HH:mm, MMM d") : "Unknown"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 min-w-[140px]">
            {isBlocked ? (
              <Button
                variant="outline"
                className="w-full border-green-500/30 text-green-500"
                onClick={() => unblockMutation.mutate()}
                disabled={unblockMutation.isPending}
                data-testid="button-unblock-device"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {unblockMutation.isPending ? "Unblocking…" : "Unblock Device"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full shadow-lg shadow-destructive/10"
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
                data-testid="button-block-device"
              >
                <Ban className="w-4 h-4 mr-2" />
                {blockMutation.isPending ? "Blocking…" : "Block Device"}
              </Button>
            )}
            <Button variant="outline" className="w-full border-white/10" data-testid="button-whitelist">
              Whitelist
            </Button>
          </div>
        </div>
      </div>

      {/* Device info grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
            <Wifi className="w-4 h-4" /> Network Info
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP Address</span>
              <span>{device.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MAC Address</span>
              <span>{device.macAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor</span>
              <span>{device.vendor || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{device.type}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Security Status
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authorization</span>
              <span className={device.isAuthorized ? "text-green-500" : "text-yellow-500"}>
                {device.isAuthorized ? "Authorized" : "Unauthorized"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={isBlocked ? "text-destructive" : "text-primary"}>
                {isBlocked ? "Blocked" : "Active"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Score</span>
              <span className={
                (device.riskScore ?? 0) > 66 ? "text-destructive" :
                (device.riskScore ?? 0) > 33 ? "text-yellow-500" : "text-primary"
              }>
                {device.riskScore ?? 0} / 100
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
