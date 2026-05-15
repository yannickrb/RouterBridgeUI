
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  macAddress: text("mac_address").notNull(),
  ipAddress: text("ip_address").notNull(),
  vendor: text("vendor"),
  type: text("type").notNull(), // 'Phone', 'Laptop', 'IoT', 'Unknown'
  isAuthorized: boolean("is_authorized").default(false),
  isBlocked: boolean("is_blocked").default(false),
  riskScore: integer("risk_score").default(0),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const packets = pgTable("packets", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id),
  sourceIp: text("source_ip").notNull(),
  destinationIp: text("destination_ip").notNull(),
  destinationHost: text("destination_host"),
  protocol: text("protocol").notNull(), // 'TCP', 'UDP', 'HTTP', 'HTTPS'
  size: integer("size").notNull(), // in bytes
  isSuspicious: boolean("is_suspicious").default(false),
  payloadSnippet: text("payload_snippet"),
  timestamp: timestamp("timestamp").defaultNow(),
  status: text("status").notNull(), // 'Allowed', 'Blocked', 'Flagged'
});

export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  packetId: integer("packet_id").references(() => packets.id),
  type: text("type").notNull(), // 'Spyware', 'Data Exfiltration', 'C2 Communication'
  severity: text("severity").notNull(), // 'Low', 'Medium', 'High', 'Critical'
  description: text("description").notNull(),
  detectedAt: timestamp("detected_at").defaultNow(),
});

// === RELATIONS ===

export const devicesRelations = relations(devices, ({ many }) => ({
  packets: many(packets),
}));

export const packetsRelations = relations(packets, ({ one, many }) => ({
  device: one(devices, {
    fields: [packets.deviceId],
    references: [devices.id],
  }),
  threats: many(threats),
}));

export const threatsRelations = relations(threats, ({ one }) => ({
  packet: one(packets, {
    fields: [threats.packetId],
    references: [packets.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true, lastSeen: true });
export const insertPacketSchema = createInsertSchema(packets).omit({ id: true, timestamp: true });
export const insertThreatSchema = createInsertSchema(threats).omit({ id: true, detectedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type Packet = typeof packets.$inferSelect;
export type InsertPacket = z.infer<typeof insertPacketSchema>;

export type Threat = typeof threats.$inferSelect;
export type InsertThreat = z.infer<typeof insertThreatSchema>;

// Request Types
export type CreateDeviceRequest = InsertDevice;
export type CreatePacketRequest = InsertPacket;

// Response Types
export type DeviceResponse = Device;
export type PacketResponse = Packet & { device?: Device }; 
export type ThreatResponse = Threat;

// Complex Response for Dashboard
export interface DashboardStats {
  totalPackets: number;
  suspiciousPackets: number;
  activeDevices: number;
  highRiskThreats: number;
  ssid: string;
  gateway: string;
  subnet: string;
}
