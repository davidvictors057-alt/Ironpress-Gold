# IRONPRESS GOLD — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the IRONPRESS GOLD app — a professional powerlifter performance tracker for Leonardo "Ironside" Rodrigues.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server)
- **Database**: PostgreSQL + Drizzle ORM (unused in current version)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### IRONPRESS GOLD (`artifacts/ironpress-gold`)

A React + Vite frontend-only app with mock data. No backend required.

**Tech:** React, Vite, Tailwind CSS, Recharts, Lucide React, Wouter (routing)

**Visual Identity:** Black (#0A0A0A) background, gold (#F5B700) accents, dark cards (#1A1A1A), Montserrat/Inter fonts.

**Pages (bottom nav with 6 tabs):**
1. `/` — Dashboard (hero, countdown, chart, stats)
2. `/treinos` — Trainings (RAW/Equipped toggle, bar chart, table)
3. `/videos` — Videos (thumbnail list, modal with comments)
4. `/campeonatos` — Championships (Arnold Classic + Olympia, line charts, simulator, AI chat)
5. `/saude` — Health (medications, pain sliders, correlation chart)
6. `/treinador` — Coach (athlete mode, coach mode with code "123456")

**Athlete:** Leonardo Rodrigues | Ironside | 95kg | Cat. 100kg
- RAW: 190kg current / 210kg goal
- Equipped F8: 280kg current (Brazilian Record) / 300kg goal

**Mock data file:** `artifacts/ironpress-gold/src/mockData.ts`

**Local storage:** Health/pain data, video comments, coach comments persisted via localStorage.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/ironpress-gold run dev` — run IRONPRESS GOLD frontend
