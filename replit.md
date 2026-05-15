# RouterBridgeUI - Network Security Dashboard

## Overview

RouterBridgeUI is a cybersecurity-themed WiFi network monitoring dashboard. It visualizes network traffic, connected devices, and security threats in real-time. The application displays packet logs, device information, threat alerts, and dashboard statistics with a dark-mode cybersecurity aesthetic. The dashboard is read-only — "Block" and "Scan" buttons are mock actions for demonstration purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router) with routes: `/` (Dashboard), `/traffic`, `/threats`, `/devices`, `/devices/:id`
- **State Management**: TanStack React Query for server state with auto-refetching (dashboard stats every 5s, recent packets every 2s, threats every 10s)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, styled with Tailwind CSS and CSS variables
- **Animations**: Framer Motion for page transitions and list animations
- **Charts**: Recharts for data visualization
- **Design**: Mobile-first, dark mode by default with a green/black cybersecurity color scheme. Inter font for UI text, JetBrains Mono for code/data values
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via tsx in dev, compiled with esbuild for production
- **API Pattern**: RESTful read-only endpoints defined in `shared/routes.ts` as a typed API contract with Zod schemas
- **API Endpoints**:
  - `GET /api/devices` — List all network devices
  - `GET /api/devices/:id` — Get single device details
  - `GET /api/packets` — List all packets with joined device data
  - `GET /api/packets/recent` — Get 20 most recent packets
  - `GET /api/threats` — List all threats with joined packet/device data
  - `GET /api/stats` — Dashboard aggregate statistics
- **Dev Server**: Vite middleware serves the frontend in development with HMR
- **Production**: Static files served from `dist/public`, server bundle at `dist/index.cjs`

### Data Storage
- **Database**: PostgreSQL, connected via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (in `shared/schema.ts`):
  - `devices` — Network devices (name, MAC, IP, vendor, type, authorization status, risk score)
  - `packets` — Network packet logs (source/dest IPs, protocol, size, suspicious flag, status)
  - `threats` — Security threats linked to packets (type, severity, description)
- **Relations**: Devices → many Packets → many Threats
- **Migrations**: Managed via `drizzle-kit push` (schema-push approach, no migration files required)
- **Seeding**: `storage.seedData()` is called on server startup to populate demo data

### Shared Code
- `shared/schema.ts` — Database table definitions, relations, insert schemas, and TypeScript types
- `shared/routes.ts` — API route contract with paths, methods, and Zod response schemas. Includes a `buildUrl` helper for parameterized routes

### Build System
- **Dev**: `npm run dev` runs tsx to start the Express server with Vite middleware
- **Build**: `npm run build` runs a custom script that builds the client with Vite and bundles the server with esbuild
- **Type Check**: `npm run check` runs TypeScript compiler in noEmit mode
- **DB Push**: `npm run db:push` pushes schema to database via drizzle-kit

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, required via `DATABASE_URL` environment variable. Uses `pg` (node-postgres) driver with connection pooling. Session store uses `connect-pg-simple`.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — ORM and schema management for PostgreSQL
- **express** v5 — HTTP server framework
- **@tanstack/react-query** — Async state management for API calls
- **wouter** — Client-side routing
- **framer-motion** — UI animations
- **recharts** — Chart components for traffic/stats visualization
- **date-fns** — Date formatting for packet timestamps
- **zod** + **drizzle-zod** — Runtime validation and schema generation
- **shadcn/ui** ecosystem — Radix UI primitives, class-variance-authority, clsx, tailwind-merge

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)