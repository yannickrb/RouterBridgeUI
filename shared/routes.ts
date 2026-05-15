
import { z } from 'zod';
import { insertDeviceSchema, insertPacketSchema, insertThreatSchema, devices, packets, threats } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  devices: {
    list: {
      method: 'GET' as const,
      path: '/api/devices' as const,
      responses: {
        200: z.array(z.custom<typeof devices.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/devices/:id' as const,
      responses: {
        200: z.custom<typeof devices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  packets: {
    list: {
      method: 'GET' as const,
      path: '/api/packets' as const,
      responses: {
        200: z.array(z.custom<typeof packets.$inferSelect & { device: typeof devices.$inferSelect | null }>()),
      },
    },
    recent: {
      method: 'GET' as const,
      path: '/api/packets/recent' as const,
      responses: {
        200: z.array(z.custom<typeof packets.$inferSelect & { device: typeof devices.$inferSelect | null }>()),
      },
    },
  },
  threats: {
    list: {
      method: 'GET' as const,
      path: '/api/threats' as const,
      responses: {
        200: z.array(z.custom<typeof threats.$inferSelect & { packet: typeof packets.$inferSelect & { device: typeof devices.$inferSelect | null } | null }>()),
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          totalPackets: z.number(),
          suspiciousPackets: z.number(),
          activeDevices: z.number(),
          highRiskThreats: z.number(),
          ssid: z.string(),
          gateway: z.string(),
          subnet: z.string(),
        }),
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
