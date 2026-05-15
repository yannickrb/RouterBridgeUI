import { useState, useEffect, useCallback, useRef } from "react";

const BRIDGE_URL = "http://localhost:8766";
const POLL_INTERVAL_MS = 30_000;
const CONNECT_TIMEOUT_MS = 3_000;

export interface BridgeDevice {
  id: string;
  name: string;
  macAddress: string;
  ipAddress: string;
  vendor: string;
  type: string;
  band: string;
  isAuthorized: boolean;
  isBlocked: boolean;
  riskScore: number;
  isReal: true;
}

export interface BridgeData {
  ok: boolean;
  ssid: string;
  gateway: string;
  subnet: string;
  devices: BridgeDevice[];
  lastPollTime: string | null;
  pollCount: number;
  error: string | null;
  bandwidth: string | null;
}

interface BridgeState {
  isConnected: boolean;
  isChecking: boolean;
  data: BridgeData | null;
  lastChecked: Date | null;
}

export function useBridge() {
  const [state, setState] = useState<BridgeState>({
    isConnected: false,
    isChecking: true,
    data: null,
    lastChecked: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    try {
      const res = await fetch(`${BRIDGE_URL}/devices`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error("Bridge returned error");
      const data: BridgeData = await res.json();

      setState({
        isConnected: true,
        isChecking: false,
        data,
        lastChecked: new Date(),
      });
    } catch {
      clearTimeout(timeout);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isChecking: false,
        lastChecked: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, isChecking: true }));
    check();
  }, [check]);

  return { ...state, refresh };
}
