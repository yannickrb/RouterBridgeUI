import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Download, Wifi, CheckCircle, XCircle, Loader2, RefreshCw, Copy, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  isChecking: boolean;
  onRefresh: () => void;
  deviceCount?: number;
  ssid?: string;
}

export function BridgeSetup({ open, onOpenChange, isConnected, isChecking, onRefresh, deviceCount, ssid }: Props) {
  const [copied, setCopied] = useState(false);

  const command = "node wifiguard-bridge.mjs YOUR_ROUTER_PASSWORD";

  function copyCommand() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wifi className="w-5 h-5 text-primary" />
            Connect Real Network Data
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Scan your actual Virgin Media Hub 5 for live device data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">

          {/* Connection status */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            isConnected
              ? "bg-primary/10 border-primary/30"
              : "bg-white/5 border-white/10"
          }`}>
            {isChecking ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : isConnected ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isChecking ? "Checking bridge…" : isConnected ? "Bridge connected" : "Bridge not running"}
              </p>
              {isConnected && (
                <p className="text-xs text-muted-foreground">
                  {deviceCount} device{deviceCount !== 1 ? "s" : ""} found
                  {ssid ? ` · ${ssid}` : ""}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onRefresh}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {!isConnected && (
            <>
              {/* Steps */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-white">Three steps to connect:</p>

                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-white">Download the bridge script</p>
                    <a
                      href="/wifiguard-bridge.mjs"
                      download="wifiguard-bridge.mjs"
                      className="inline-flex items-center gap-2 text-xs bg-white/5 border border-white/10 hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      wifiguard-bridge.mjs
                    </a>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-white">
                      Open a terminal and run it with your{" "}
                      <span className="text-primary font-medium">router admin password</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Find it on the sticker on the <strong className="text-white">bottom of your Hub 5</strong> — labelled <em>"Router password"</em> (not the Wi-Fi password).
                    </p>
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-primary overflow-x-auto">
                        <Terminal className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="flex-1 whitespace-nowrap">{command}</span>
                        <button onClick={copyCommand} className="flex-shrink-0 text-muted-foreground hover:text-white transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Requires <strong className="text-white">Node.js</strong> — no extra installs needed.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-sm text-white">Click Refresh — the dashboard will show your real devices</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 space-y-1">
                <p className="font-medium">Security note</p>
                <p className="text-yellow-400/80">The bridge script runs entirely on your computer and never sends your router password anywhere. All data stays local.</p>
              </div>

              <Button className="w-full bg-primary text-black font-semibold" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                I've started the bridge — check connection
              </Button>
            </>
          )}

          {isConnected && (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your dashboard is now showing <strong className="text-white">live data</strong> from your Virgin Media Hub 5. The bridge refreshes every 30 seconds.
              </p>
              <Button className="w-full bg-primary text-black font-semibold" onClick={() => onOpenChange(false)}>
                View Live Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BridgeBadgeProps {
  isConnected: boolean;
  isChecking: boolean;
  onClick: () => void;
}

export function BridgeBadge({ isConnected, isChecking, onClick }: BridgeBadgeProps) {
  return (
    <button
      onClick={onClick}
      data-testid="button-bridge-status"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        isConnected
          ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
      }`}
    >
      {isChecking ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isConnected ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full bg-white/20" />
      )}
      {isChecking ? "Checking…" : isConnected ? "Live Network" : "Connect Real Network"}
    </button>
  );
}
