import { useDashboardStats, useRecentPackets } from "@/hooks/use-dashboard";
import { StatsCard } from "@/components/StatsCard";
import { PacketRow } from "@/components/PacketRow";
import { AlertTriangle, Radio, RefreshCw, ShieldAlert, ShieldCheck, Wifi, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { useBridge } from "@/hooks/use-bridge";
import { BridgeSetup, BridgeBadge } from "@/components/BridgeSetup";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: allPackets, isLoading: packetsLoading } = useRecentPackets();
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const bridge = useBridge();

  const isLive = bridge.isConnected && !!bridge.data;
  const displaySsid    = isLive ? bridge.data!.ssid    : null;
  const displayGateway = isLive ? bridge.data!.gateway : null;
  const displaySubnet  = isLive ? bridge.data!.subnet  : null;
  const displayDevices = isLive ? bridge.data!.devices.length : 0;
  const displayBandwidth = isLive ? (bridge.data!.bandwidth ?? "—") : "—";

  // Only show suspicious packets in the live feed
  const suspiciousPackets = allPackets?.filter((p: any) => p.isSuspicious) ?? [];

  if (statsLoading) {
    return <div className="p-8 flex items-center justify-center h-full text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {isLive ? (
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-5 h-5 text-primary" />
              <span className="text-primary font-mono font-semibold text-lg" data-testid="text-ssid">{displaySsid}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground font-mono text-sm">No router connected</span>
            </div>
          )}
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Network Security Overview</h2>
          <p className="text-muted-foreground text-sm">Monitoring for rogue devices and suspicious activity — not browsing history.</p>
        </div>
        <div className="flex items-center gap-3">
          <BridgeBadge
            isConnected={bridge.isConnected}
            isChecking={bridge.isChecking}
            onClick={() => setBridgeOpen(true)}
          />
          {isLive && (
            <Button
              data-testid="button-scan"
              variant="outline"
              className="border-white/10"
              onClick={bridge.refresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Bandwidth"
          value={displayBandwidth}
          icon={Gauge}
        />
        <StatsCard
          label="Suspicious Packets"
          value={stats?.suspiciousPackets ?? 0}
          icon={Radio}
          alert={(stats?.suspiciousPackets ?? 0) > 0}
        />
        <StatsCard
          label="Active Threats"
          value={stats?.highRiskThreats ?? 0}
          icon={ShieldAlert}
          alert={(stats?.highRiskThreats ?? 0) > 0}
        />
        <StatsCard
          label="Devices on Network"
          value={displayDevices}
          icon={Wifi}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Suspicious activity feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Suspicious Activity
            </h3>
            {suspiciousPackets.length > 0 && (
              <Link href="/traffic" className="text-sm text-primary hover:underline" data-testid="link-view-all-traffic">View All</Link>
            )}
          </div>

          <div className="space-y-3">
            {packetsLoading ? (
              <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ) : suspiciousPackets.length === 0 ? (
              <div
                className="p-10 text-center border border-dashed border-white/10 rounded-xl text-muted-foreground space-y-2 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setBridgeOpen(true)}
              >
                <ShieldCheck className="w-8 h-8 text-green-500 opacity-40 mx-auto" />
                <p className="text-sm text-green-500 font-medium">No suspicious activity detected</p>
                <p className="text-xs opacity-60">
                  {isLive
                    ? "Your network looks clean — normal traffic is not recorded"
                    : "Connect your router bridge to start monitoring →"}
                </p>
              </div>
            ) : (
              suspiciousPackets.map((packet: any) => (
                <motion.div
                  key={packet.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PacketRow packet={packet} />
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Network status panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Network Status</h3>
          <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SSID</span>
                <span className="font-mono text-primary" data-testid="text-ssid-detail">{displaySsid ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gateway</span>
                <span className="font-mono">{displayGateway ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subnet</span>
                <span className="font-mono">{displaySubnet ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bandwidth</span>
                <span className="font-mono">{displayBandwidth}</span>
              </div>
              {isLive && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-mono text-primary text-xs">Virgin Media Hub 5 · Live</span>
                </div>
              )}
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Protection Modules</h4>
              {[
                { icon: ShieldAlert, label: "ARP Spoof Detection" },
                { icon: Radio,       label: "Rogue Device Scanner" },
                { icon: Wifi,        label: "Rogue AP Scanner" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isLive ? "bg-primary shadow-[0_0_5px_theme('colors.primary.DEFAULT')]" : "bg-white/20"}`} />
                </div>
              ))}
            </div>

            {!isLive && (
              <button
                onClick={() => setBridgeOpen(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-white/10 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-all text-center"
              >
                Connect real router data →
              </button>
            )}
          </div>
        </div>
      </div>

      <BridgeSetup
        open={bridgeOpen}
        onOpenChange={setBridgeOpen}
        isConnected={bridge.isConnected}
        isChecking={bridge.isChecking}
        onRefresh={bridge.refresh}
        deviceCount={bridge.data?.devices.length}
        ssid={bridge.data?.ssid}
      />
    </div>
  );
}
