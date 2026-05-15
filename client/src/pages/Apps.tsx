import { useBridge, BridgeDevice } from "@/hooks/use-bridge";
import { BridgeSetup, BridgeBadge } from "@/components/BridgeSetup";
import { Wifi, Laptop, Smartphone, HardDrive, Tv, Gamepad2, Speaker, Router } from "lucide-react";
import { useState } from "react";

function getDeviceIcon(type: string) {
  switch (type) {
    case "Phone":   return Smartphone;
    case "Laptop":  return Laptop;
    case "IoT":     return HardDrive;
    case "TV":      return Tv;
    case "Gaming":  return Gamepad2;
    case "Speaker": return Speaker;
    case "Tablet":  return Laptop;
    default:        return Wifi;
  }
}

function LiveDeviceCard({ device }: { device: BridgeDevice }) {
  const DeviceIcon = getDeviceIcon(device.type);
  return (
    <div
      data-testid={`card-live-device-${device.id}`}
      className="group bg-card border border-primary/10 p-5 rounded-2xl hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden"
    >
      {/* Live pulse */}
      <div className="absolute top-3 right-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center border border-white/5 group-hover:border-primary/50 group-hover:text-primary transition-colors text-muted-foreground">
          <DeviceIcon className="w-6 h-6" />
        </div>
        {device.band && (
          <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20 mr-5">
            {device.band}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{device.name}</h3>
        <p className="text-xs text-muted-foreground font-mono truncate">{device.ipAddress}</p>
        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{device.macAddress}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
        <span>{device.vendor || device.type}</span>
        <span className="text-primary font-medium">Connected</span>
      </div>
    </div>
  );
}

export default function Devices() {
  const bridge = useBridge();
  const [bridgeOpen, setBridgeOpen] = useState(false);

  const isLive = bridge.isConnected && bridge.data && bridge.data.devices.length > 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-devices-title">
            WiFi Devices
            {isLive && (
              <span className="ml-3 text-sm font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 align-middle">
                LIVE
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isLive
              ? `${bridge.data!.devices.length} real device${bridge.data!.devices.length !== 1 ? "s" : ""} on ${bridge.data!.ssid}`
              : "Connect your router to see real devices on your network."}
          </p>
        </div>
        <BridgeBadge
          isConnected={bridge.isConnected}
          isChecking={bridge.isChecking}
          onClick={() => setBridgeOpen(true)}
        />
      </div>

      {isLive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bridge.data!.devices.map((device) => (
            <LiveDeviceCard key={device.id} device={device} />
          ))}
        </div>
      ) : (
        <div
          className="py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-center cursor-pointer hover:border-primary/30 transition-colors space-y-3"
          onClick={() => setBridgeOpen(true)}
        >
          <Router className="w-12 h-12 text-muted-foreground opacity-30" />
          <div>
            <p className="text-base font-medium text-white">No devices yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your Virgin Media Hub 5 to see all devices on your network
            </p>
          </div>
          <span className="text-xs text-primary hover:underline">Set up bridge connection →</span>
        </div>
      )}

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
