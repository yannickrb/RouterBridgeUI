
import { db } from "./db";
import {
  devices,
  packets,
  threats,
  type Device,
  type Packet,
  type Threat,
  type InsertDevice,
  type InsertPacket,
  type DashboardStats
} from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";

export interface IStorage {
  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  blockDevice(id: number): Promise<Device | undefined>;
  unblockDevice(id: number): Promise<Device | undefined>;

  // Packets
  getPackets(): Promise<(Packet & { device: Device | null })[]>;
  getRecentPackets(limit: number): Promise<(Packet & { device: Device | null })[]>;
  createPacket(packet: InsertPacket): Promise<Packet>;

  // Threats
  getThreats(): Promise<(Threat & { packet: (Packet & { device: Device | null }) | null })[]>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;

  // Setup
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [newDevice] = await db.insert(devices).values(device).returning();
    return newDevice;
  }

  async blockDevice(id: number): Promise<Device | undefined> {
    const [updated] = await db.update(devices).set({ isBlocked: true }).where(eq(devices.id, id)).returning();
    return updated;
  }

  async unblockDevice(id: number): Promise<Device | undefined> {
    const [updated] = await db.update(devices).set({ isBlocked: false }).where(eq(devices.id, id)).returning();
    return updated;
  }

  async getPackets(): Promise<(Packet & { device: Device | null })[]> {
    return await db.query.packets.findMany({
      with: { device: true },
      orderBy: desc(packets.timestamp),
      limit: 100
    });
  }

  async getRecentPackets(limit: number): Promise<(Packet & { device: Device | null })[]> {
    return await db.query.packets.findMany({
      with: { device: true },
      orderBy: desc(packets.timestamp),
      limit
    });
  }

  async createPacket(packet: InsertPacket): Promise<Packet> {
    const [newPacket] = await db.insert(packets).values(packet).returning();
    return newPacket;
  }

  async getThreats(): Promise<(Threat & { packet: (Packet & { device: Device | null }) | null })[]> {
    return await db.query.threats.findMany({
      with: { packet: { with: { device: true } } },
      orderBy: desc(threats.detectedAt)
    });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [packetCount]    = await db.select({ count: count() }).from(packets);
    const [suspCount]      = await db.select({ count: count() }).from(packets).where(eq(packets.isSuspicious, true));
    const [deviceCount]    = await db.select({ count: count() }).from(devices);
    const [threatCount]    = await db.select({ count: count() }).from(threats).where(eq(threats.severity, "High"));

    return {
      totalPackets:     packetCount?.count  || 0,
      suspiciousPackets: suspCount?.count   || 0,
      activeDevices:    deviceCount?.count  || 0,
      highRiskThreats:  threatCount?.count  || 0,
      ssid:    "",
      gateway: "",
      subnet:  "",
    };
  }

  async seedData(): Promise<void> {
    // Clear any previously stored data so the app always starts empty.
    await db.delete(threats);
    await db.delete(packets);
    await db.delete(devices);
  }
}

export const storage = new DatabaseStorage();
