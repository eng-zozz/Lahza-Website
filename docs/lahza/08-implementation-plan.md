# Implementation Plan (Phase 1)

Build order is dependency-driven: foundation → auth → data modules → portal → polish.
Per your choice, **Auth + RBAC is the first module after the public site.**

## Sprint 0 — Foundation (1–2 days)
- [ ] `create-next-app@latest` (TS, App Router, Tailwind, src dir, ESLint).
- [ ] Install: `prisma @prisma/client`, `next-auth@beta @auth/prisma-adapter`,
      `next-intl`, `@tanstack/react-query`, `zod`, `@dnd-kit/core @dnd-kit/sortable`,
      `framer-motion`, `recharts`, `@aws-sdk/client-s3 @aws-sdk/s3-request-presigner`,
      `resend`, `stripe`, `bcryptjs`, `sonner`.
- [ ] shadcn init + add primitives (see UI doc).
- [ ] `lib/env.ts`, `lib/prisma.ts`, design tokens in `globals.css`.
- [ ] next-intl routing + `[locale]` segment + EN/AR catalogs + RTL.

## Sprint 1 — Public Website
- [ ] Navbar (locale toggle, sticky), Footer.
- [ ] `/` home (Hero, FeatureGrid, StatsBand, CaseStudy teaser, Pricing teaser, CTA).
- [ ] `/services`, `/about`, `/case-studies`, `/pricing`, `/contact`.
- [ ] Contact form → Server Action → Resend + create `Lead(source=WEBSITE)`.
- [ ] Per-page metadata (title/description/og) EN + AR. Framer Motion reveals.

## Sprint 2 — Auth + RBAC  ← FIRST APP MODULE
- [ ] Prisma schema (full) + `migrate dev` + seed (SUPER_ADMIN + demo users).
- [ ] `lib/auth.ts` (Credentials + Google), type augmentation.
- [ ] `/login`, `/register`, `/reset-password` pages.
- [ ] `rbac.ts` permission matrix + `requirePermission` guards.
- [ ] `middleware.ts` (locale + role-based route gating).
- [ ] `(dashboard)` shell with RBAC-filtered sidebar; `/unauthorized` page.

## Sprint 3 — CRM
- [ ] Lead repository, schema, actions (CRUD + move).
- [ ] Pipeline board with `@dnd-kit`, optimistic React Query updates.
- [ ] Search + filters; lead detail page; convert-to-client.

## Sprint 4 — Project Management
- [ ] Project + Task repositories, schemas, actions.
- [ ] Project list + CRUD; detail page tabs.
- [ ] Kanban board (DnD), task CRUD + assignment + deadlines.
- [ ] Comments; S3 attachments (presign route); progress computation.

## Sprint 5 — Client Portal
- [ ] `(portal)` shell (CLIENT only).
- [ ] Overview, projects (read-only), files (upload/download deliverables),
      invoices, meetings, notifications — all scoped to the client.

## Sprint 6 — Admin Dashboard + Billing foundation
- [ ] Dashboard aggregation queries; stat cards; Recharts; activity feed.
- [ ] Invoice model + Stripe Checkout + webhook handler.
- [ ] Resend transactional emails; notifications wiring.

## Sprint 7 — Hardening
- [ ] `output: standalone`, Dockerfile + compose, health route.
- [ ] CI pipeline, `.env.example`, README, seed script.
- [ ] Accessibility + RTL QA pass; Lighthouse/SEO pass.

## Phase 2 (later)
AI Automation Dashboard · Team Workspace · advanced billing/subscriptions ·
audit logs · realtime (websockets) · reporting/exports.

## Definition of Done (Phase 1)
Public site live (EN/AR) · login + 4 roles enforced · CRM pipeline DnD working ·
projects + Kanban working · client portal scoped · admin dashboard with real stats ·
Dockerized + deployable to Vercel.
