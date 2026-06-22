# Lahza.ai — Production Architecture Blueprint

> **Status:** Architecture & implementation plan (Phase 1).
> **Note:** This is reference documentation for a standalone Next.js 15 codebase.
> It is intentionally **not** wired into this TanStack sandbox — it describes
> a separate repository you would scaffold with `create-next-app`.

## 1. Product

**Lahza.ai** — an all-in-one agency platform combining:

| Module | Phase | Description |
|---|---|---|
| Agency Website | 1 | Public bilingual (EN/AR) marketing site |
| Authentication + RBAC | 1 | Auth.js, 4 roles, protected routes |
| CRM | 1 | Lead pipeline with drag-and-drop |
| Project Management | 1 | Projects, tasks, Kanban board |
| Client Portal | 1 | Client-facing dashboard |
| Admin Dashboard | 1 | Stats, charts, activity |
| AI Automation Dashboard | 2 | — |
| Billing System | 1→2 | Stripe subscriptions + invoices |
| Team Workspace | 2 | — |

## 2. Tech Stack

```
Frontend   Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · shadcn/ui · Framer Motion
Backend    Next.js Server Actions · Route Handlers
ORM        Prisma
DB         PostgreSQL
Auth       Auth.js (NextAuth v5)
Storage    AWS S3 (presigned uploads)
Email      Resend
Payments   Stripe
i18n       next-intl (EN default, AR with RTL)
Deploy     Docker (self-host) + Vercel
Quality    Zod · React Query (TanStack Query) · Repository pattern · Clean Architecture
```

## 3. Brand

```
Primary    #C7F02D   (lime/acid green)
Dark       #0A0A12   (near-black)
```

Modern SaaS aesthetic: dark hero, lime accents, generous whitespace, large type,
subtle Framer Motion entrance + scroll reveals.

## 4. Document Index

| File | Contents |
|---|---|
| `00-overview.md` | This file |
| `01-folder-structure.md` | Feature-based folder layout |
| `02-prisma-schema.md` | Full schema + relationships |
| `03-auth-rbac.md` | Auth.js config, roles, permissions, guards |
| `04-api-architecture.md` | Server Actions, Route Handlers, repository pattern |
| `05-ui-architecture.md` | Design system, components, i18n/RTL, dashboards |
| `06-modules.md` | CRM, Projects/Kanban, Client Portal, Admin specs |
| `07-deployment.md` | Docker, Vercel, env vars, CI |
| `08-implementation-plan.md` | Sprint-by-sprint build order |
