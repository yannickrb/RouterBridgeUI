#!/usr/bin/env node
/**
 * RouterBridgeUI Local Bridge — Virgin Media Hub 5
 * Pure Node.js, no dependencies required.
 *
 * Usage:
 *   node wifiguard-bridge.mjs YOUR_ROUTER_ADMIN_PASSWORD
 *   node wifiguard-bridge.mjs YOUR_ROUTER_ADMIN_PASSWORD --debug   (verbose output)
 *
 * The router admin password is on the sticker on the BOTTOM of your Hub 5,
 * labelled "Router password" (NOT the Wi-Fi password).
 */

import http  from "http";
import https from "https";

const ROUTER_IP   = "192.168.0.1";
const BRIDGE_PORT = 8766;
const POLL_MS     = 30_000;

const password = process.argv[2];
const DEBUG    = process.argv.includes("--debug");

if (!password) {
  console.error("❌  Usage: node wifiguard-bridge.mjs YOUR_ROUTER_ADMIN_PASSWORD [--debug]");
  console.error("   The router password is on the sticker on the bottom of your Hub 5.");
  process.exit(1);
}

function dbg(...args) { if (DEBUG) console.log("  [debug]", ...args); }

// ── State ──────────────────────────────────────────────────────────────────
let sessionCookie = "";
let cachedDevices = [];
let ssid          = "Virgin Media Hub 5";
let gateway       = ROUTER_IP;
let lastPollTime  = null;
let lastError     = null;
let pollCount     = 0;
let routerScheme  = null;
let routerPort    = null;

// ── Raw HTTP/HTTPS request ─────────────────────────────────────────────────
function rawRequest(mod, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = mod.request({ rejectUnauthorized: false, ...options }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", reject);
    req.setTimeout(10_000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

function routerRequest(options, body = null) {
  const mod  = routerScheme === "https" ? https : http;
  const port = routerPort ?? (routerScheme === "https" ? 443 : 80);
  return rawRequest(mod, { host: ROUTER_IP, port, ...options }, body);
}

// ── Probe: find which scheme+port the router responds on ───────────────────
async function probeRouter() {
  const candidates = [
    { scheme: "http",  port: 80  },
    { scheme: "https", port: 443 },
    { scheme: "http",  port: 8080 },
  ];
  for (const { scheme, port } of candidates) {
    const mod = scheme === "https" ? https : http;
    dbg(`Probing ${scheme}://${ROUTER_IP}:${port}/`);
    try {
      const res = await rawRequest(mod, {
        host: ROUTER_IP, port, path: "/", method: "GET",
        rejectUnauthorized: false,
      });
      if (res.statusCode < 500) {
        console.log(`📡  Router responds on ${scheme}://${ROUTER_IP}:${port}  (HTTP ${res.statusCode})`);
        routerScheme = scheme;
        routerPort   = port;
        return true;
      }
    } catch (e) {
      dbg(`  ${scheme}:${port} failed: ${e.message}`);
    }
  }
  return false;
}

// ── Authentication ─────────────────────────────────────────────────────────

/**
 * Try every known login pattern for the Virgin Media Hub 5 / Compal CH7465CE.
 * Patterns sourced from community reverse-engineering of Hub 5 traffic.
 */
async function login() {
  console.log(`🔐  Authenticating with router at ${routerScheme}://${ROUTER_IP}:${routerPort} ...`);

  // First, try to read the login page HTML to find the real form action + fields
  let detectedPath   = null;
  let detectedFields = null;
  try {
    const page = await routerRequest({ path: "/", method: "GET", headers: { Accept: "text/html" } });
    dbg(`Login page status: ${page.statusCode}`);
    const html = page.body;

    // Extract form action
    const actionMatch = html.match(/action=["']([^"']*login[^"']*)["']/i);
    if (actionMatch) {
      const rawAction = actionMatch[1];
      detectedPath = rawAction.startsWith("http") ? new URL(rawAction).pathname : rawAction;
      dbg(`Detected login form action: ${detectedPath}`);
    }

    // Extract password field name
    const pwMatch = html.match(/<input[^>]+type=["']?password["']?[^>]*name=["']([^"']+)["']/i)
                 || html.match(/name=["']([^"']+)["'][^>]*type=["']?password["']?/i);
    if (pwMatch) {
      detectedFields = pwMatch[1];
      dbg(`Detected password field name: ${detectedFields}`);
    }

    // If page itself redirected to a login form, extract the action from there
    if (!detectedPath && page.statusCode === 302) {
      const loc = page.headers.location || "";
      if (loc.includes("login")) detectedPath = new URL(loc, `${routerScheme}://${ROUTER_IP}`).pathname;
    }
  } catch (e) {
    dbg(`Could not fetch login page: ${e.message}`);
  }

  // Build list of login attempts: detected first, then all known patterns
  const attempts = [];

  // If we detected the actual form, try it first
  if (detectedPath && detectedFields) {
    attempts.push({ path: detectedPath, fields: { [detectedFields]: password } });
    attempts.push({ path: detectedPath, fields: { [detectedFields]: password, loginUsername: "admin" } });
  }

  // Known Virgin Media Hub 5 / Compal CH7465CE patterns
  attempts.push(
    // Hub 5 primary: loginData.cgi
    { path: "/loginData.cgi",        fields: { loginUsername: "admin", loginPassword: password } },
    // Hub 5 variant
    { path: "/loginData.cgi",        fields: { loginUsername: "admin", loginPassword: password, "submit.htm%3flogin.htm": "" } },
    // Compal getter.xml pattern
    { path: "/xml/getter.xml",       fields: { RouterLoginPassword: password, "getpage": "http://192.168.0.1/index.html", "errorpage": "http://192.168.0.1/login.html", "var:loginstatus": "0", "var:loginretry": "0" } },
    // Generic /login
    { path: "/login",                fields: { Username: "admin", Password: password } },
    { path: "/login",                fields: { username: "admin", password } },
    // CGI variants
    { path: "/cgi-bin/login",        fields: { username: "admin", password } },
    { path: "/goform/login",         fields: { username: "admin", password } },
  );

  for (const { path, fields } of attempts) {
    const bodyStr = Object.entries(fields)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    dbg(`Trying POST ${path} with fields: ${Object.keys(fields).join(", ")}`);

    try {
      const res = await routerRequest({
        path, method: "POST",
        headers: {
          "Content-Type":   "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(bodyStr),
          "Referer":        `${routerScheme}://${ROUTER_IP}/`,
          "Origin":         `${routerScheme}://${ROUTER_IP}`,
          "Accept":         "text/html,application/xhtml+xml,*/*",
          "User-Agent":     "Mozilla/5.0 (compatible; WiFiGUARD/1.0)",
        },
      }, bodyStr);

      dbg(`  → HTTP ${res.statusCode}, Set-Cookie: ${(res.headers["set-cookie"] || []).join("; ").slice(0,80)}`);

      const rawCookies = [res.headers["set-cookie"] || []].flat();
      const allCookies = rawCookies.map((c) => c.split(";")[0]).filter(Boolean);

      if (allCookies.length > 0 && (res.statusCode === 200 || res.statusCode === 302)) {
        // Check we're not getting the login page back (failed login)
        const isLoginPage = res.body.toLowerCase().includes("loginpassword") ||
                            res.body.toLowerCase().includes("logindata") ||
                            (res.body.toLowerCase().includes("login") && res.body.length < 5000);
        if (!isLoginPage || res.statusCode === 302) {
          sessionCookie = allCookies.join("; ");
          console.log(`✅  Authenticated via ${path}`);
          return;
        }
        dbg(`  → Got cookies but response looks like login page still — trying next`);
      }
    } catch (e) {
      dbg(`  → Error: ${e.message}`);
    }
  }

  // Try JSON login as last resort
  try {
    const jsonBody = JSON.stringify({ username: "admin", password });
    dbg("Trying JSON POST /api/v1/session/login");
    const res = await routerRequest({
      path: "/api/v1/session/login", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(jsonBody) },
    }, jsonBody);
    if (res.statusCode === 200) {
      const rawCookies = [res.headers["set-cookie"] || []].flat();
      sessionCookie = rawCookies.map((c) => c.split(";")[0]).join("; ");
      console.log("✅  Authenticated via JSON API");
      return;
    }
    dbg(`  → JSON login: HTTP ${res.statusCode}`);
  } catch (e) {
    dbg(`  → JSON login error: ${e.message}`);
  }

  console.error("\n❌  Authentication failed. Things to try:");
  console.error("   1. Run with --debug for more detail: node wifiguard-bridge.mjs PASSWORD --debug");
  console.error("   2. Double-check the Router password on the sticker on the bottom of your Hub 5.");
  console.error("   3. Make sure you're connected to the same WiFi network as the Hub.");
  console.error("   4. Try opening http://192.168.0.1 in your browser to confirm the password works.\n");
  throw new Error("Authentication failed — see suggestions above.");
}

// ── Fetch connected devices ────────────────────────────────────────────────
async function fetchConnectedDevices() {
  const endpoints = [
    "/getConnectedDevices",
    "/api/v1/network/getConnectedDevices",
    "/getRgDeviceList",
    "/xml/getter.xml?getpage=http://192.168.0.1/goform/getIndex&var:menu=info",
    "/goform/getDeviceList",
  ];

  for (const path of endpoints) {
    try {
      dbg(`Trying device endpoint: ${path}`);
      const res = await routerRequest({
        path, method: "GET",
        headers: {
          Cookie:   sessionCookie,
          Accept:   "application/json, text/plain, */*",
          Referer:  `${routerScheme}://${ROUTER_IP}/`,
          "User-Agent": "Mozilla/5.0 (compatible; WiFiGUARD/1.0)",
        },
      });
      dbg(`  → HTTP ${res.statusCode}, body[:80]: ${res.body.slice(0,80)}`);

      if (res.statusCode === 401 || res.statusCode === 403) {
        console.log("🔄  Session expired — re-authenticating...");
        await login();
        continue;
      }

      const trimmed = res.body.trim();
      if (res.statusCode === 200 && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
        const parsed = JSON.parse(trimmed);
        const devs = normalizeDevices(parsed);
        if (devs.length > 0) {
          console.log(`✅  Got ${devs.length} device(s) from ${path}`);
          return devs;
        }
      }
    } catch (e) {
      dbg(`  → ${e.message}`);
    }
  }

  // Fallback: scrape HTML for MAC/IP pairs
  try {
    const res = await routerRequest({
      path: "/", method: "GET",
      headers: { Cookie: sessionCookie },
    });
    const devs = parseDhcpHtml(res.body);
    if (devs.length > 0) {
      console.log(`✅  Scraped ${devs.length} device(s) from HTML`);
      return devs;
    }
  } catch (_) {}

  console.warn("⚠️   Could not retrieve device list — will retry next poll.");
  return cachedDevices; // return last known list rather than erroring
}

// ── Fetch router info (SSID + bandwidth) ──────────────────────────────────
let bandwidthMbps = null;

async function fetchRouterInfo() {
  const paths = ["/getRouterStatus", "/api/v1/network/status", "/api/v1/wifi/status", "/goform/getWifiSettings"];
  for (const path of paths) {
    try {
      const res = await routerRequest({
        path, method: "GET",
        headers: { Cookie: sessionCookie, Accept: "application/json" },
      });
      if (res.statusCode === 200 && res.body.includes("{")) {
        const d = JSON.parse(res.body);
        ssid    = d?.ssid || d?.SSID || d?.wirelessSSID || d?.data?.ssid || d?.SSIDName || ssid;
        gateway = ROUTER_IP;
        dbg(`SSID detected: ${ssid}`);
        break;
      }
    } catch (_) {}
  }

  // Try to fetch downstream bandwidth
  const bwPaths = [
    "/getWanStatus",
    "/api/v1/wan/status",
    "/api/v1/network/wan",
    "/goform/getWanInfo",
  ];
  for (const path of bwPaths) {
    try {
      const res = await routerRequest({
        path, method: "GET",
        headers: { Cookie: sessionCookie, Accept: "application/json" },
      });
      if (res.statusCode === 200 && res.body.includes("{")) {
        const d = JSON.parse(res.body);
        const raw = d?.downstreamSpeed || d?.downloadSpeed || d?.bandwidth ||
                    d?.data?.downstreamSpeed || d?.wanSpeed || d?.downSpeed;
        if (raw) {
          const mbps = parseFloat(raw);
          bandwidthMbps = isNaN(mbps) ? String(raw) : `${mbps.toFixed(1)} Mbps`;
          dbg(`Bandwidth detected: ${bandwidthMbps}`);
          break;
        }
      }
    } catch (_) {}
  }
}

// ── Normalise device list ──────────────────────────────────────────────────
function normalizeDevices(parsed) {
  let raw = [];
  if (Array.isArray(parsed))                       raw = parsed;
  else if (Array.isArray(parsed.data))             raw = parsed.data;
  else if (Array.isArray(parsed.devices))          raw = parsed.devices;
  else if (Array.isArray(parsed.clients))          raw = parsed.clients;
  else if (Array.isArray(parsed.connectedDevices)) raw = parsed.connectedDevices;
  else {
    for (const v of Object.values(parsed))
      if (Array.isArray(v) && v.length) { raw = v; break; }
  }

  return raw.map((d, i) => {
    const mac  = d.MACAddr || d.mac || d.macAddress || d.MAC || `00:00:00:00:00:${String(i).padStart(2,"0")}`;
    const ip   = d.IPAddr  || d.ip  || d.ipAddress  || d.IP  || "unknown";
    const host = d.hostname || d.name || d.hostName || d.DeviceName || ip;
    const band = d.band || d.Band || d.frequency || "";
    return {
      id: mac, name: host === ip ? `Device (${mac.slice(-5)})` : host,
      macAddress: mac, ipAddress: ip,
      vendor: d.vendor || d.Vendor || d.manufacturer || "",
      type: guessType(host), band: band || "WiFi",
      isAuthorized: true, isBlocked: false, riskScore: 0, isReal: true,
    };
  });
}

function guessType(h = "") {
  h = h.toLowerCase();
  if (/iphone|android|pixel|samsung|galaxy/.test(h)) return "Phone";
  if (/macbook|laptop|notebook|desktop|windows|dell|hp-/.test(h)) return "Laptop";
  if (/ipad|tablet/.test(h)) return "Tablet";
  if (/tv|fire|roku|chromecast|appletv|firetv/.test(h)) return "TV";
  if (/xbox|playstation|ps[45]|switch/.test(h)) return "Gaming";
  if (/echo|alexa|google-home|homepod/.test(h)) return "Speaker";
  if (/ring|nest|hue|fridge|washer|thermostat|cam/.test(h)) return "IoT";
  return "Unknown";
}

function parseDhcpHtml(html) {
  const macs = html.match(/([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}/g) || [];
  const ips  = html.match(/192\.168\.\d{1,3}\.\d{1,3}/g) || [];
  const seen = new Set();
  return macs.filter((m) => !seen.has(m) && seen.add(m)).map((mac, i) => ({
    id: mac, name: `Device (${mac.slice(-5)})`, macAddress: mac,
    ipAddress: ips[i] || "unknown", vendor: "", type: "Unknown",
    band: "WiFi", isAuthorized: true, isBlocked: false, riskScore: 0, isReal: true,
  }));
}

// ── Poll loop ──────────────────────────────────────────────────────────────
async function poll() {
  try {
    cachedDevices = await fetchConnectedDevices();
    lastPollTime  = new Date().toISOString();
    lastError     = null;
    pollCount++;
    console.log(`📡  [${new Date().toLocaleTimeString()}] ${cachedDevices.length} device(s) on network`);
    if (pollCount === 1) await fetchRouterInfo().catch(() => {});
  } catch (err) {
    lastError = err.message;
    console.error("❌  Poll error:", err.message);
    if (/auth|401/i.test(err.message)) await login().catch(() => {});
  }
}

// ── Bridge HTTP server ─────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":          "*",
  "Access-Control-Allow-Methods":         "GET, OPTIONS",
  "Access-Control-Allow-Headers":         "Content-Type",
  "Access-Control-Allow-Private-Network": "true",
  "Content-Type":                         "application/json",
};

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); res.end(); return; }
  if (req.url === "/devices" || req.url === "/") {
    res.writeHead(200, CORS);
    res.end(JSON.stringify({
      ok: true, ssid, gateway,
      subnet: `${gateway.split(".").slice(0,3).join(".")}.0/24`,
      devices: cachedDevices, lastPollTime, pollCount, error: lastError,
      bandwidth: bandwidthMbps,
    }));
    return;
  }
  res.writeHead(404, CORS);
  res.end(JSON.stringify({ ok: false, message: "Not found" }));
});

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  WiFiGUARD Local Bridge — Virgin Media Hub 5");
  if (DEBUG) console.log("  [DEBUG MODE ON]");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const found = await probeRouter();
    if (!found) {
      console.error("❌  Cannot reach router at", ROUTER_IP);
      console.error("   Make sure you're connected to the Hub 5's WiFi network.");
      lastError = "Cannot reach router";
    } else {
      await login();
      await poll();
    }
  } catch (err) {
    lastError = err.message;
  }

  setInterval(poll, POLL_MS);

  server.listen(BRIDGE_PORT, "127.0.0.1", () => {
    console.log(`\n🌐  Bridge running at http://localhost:${BRIDGE_PORT}`);
    console.log("   WiFiGUARD will connect automatically.");
    console.log("   Press Ctrl+C to stop.\n");
  });
})();
