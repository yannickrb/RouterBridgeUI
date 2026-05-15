import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await storage.seedData();

  app.get(api.devices.list.path, async (_req, res) => {
    const result = await storage.getDevices();
    res.json(result);
  });

  app.get(api.devices.get.path, async (req, res) => {
    const device = await storage.getDevice(Number(req.params.id));
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  });

  app.post("/api/devices/:id/block", async (req, res) => {
    const device = await storage.blockDevice(Number(req.params.id));
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  });

  app.post("/api/devices/:id/unblock", async (req, res) => {
    const device = await storage.unblockDevice(Number(req.params.id));
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  });

  app.get(api.packets.list.path, async (_req, res) => {
    const result = await storage.getPackets();
    res.json(result);
  });

  app.get(api.packets.recent.path, async (_req, res) => {
    const result = await storage.getRecentPackets(20);
    res.json(result);
  });

  app.get(api.threats.list.path, async (_req, res) => {
    const result = await storage.getThreats();
    res.json(result);
  });

  app.get(api.stats.get.path, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  return httpServer;
}
