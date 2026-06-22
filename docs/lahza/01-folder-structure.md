# Folder Structure (Feature-Based + Clean Architecture)

```
lahza/
├─ docker/
│  ├─ Dockerfile
│  └─ docker-compose.yml
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ public/
│  ├─ logo.svg
│  └─ locales/                  # static og images etc.
├─ messages/                    # next-intl translation catalogs
│  ├─ en.json
│  └─ ar.json
├─ src/
│  ├─ app/
│  │  ├─ [locale]/              # i18n segment (en | ar)
│  │  │  ├─ (marketing)/        # public site group
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ page.tsx                 # /
│  │  │  │  ├─ services/page.tsx        # /services
│  │  │  │  ├─ about/page.tsx           # /about
│  │  │  │  ├─ case-studies/page.tsx    # /case-studies
│  │  │  │  ├─ pricing/page.tsx         # /pricing
│  │  │  │  └─ contact/page.tsx         # /contact
│  │  │  ├─ (auth)/
│  │  │  │  ├─ login/page.tsx
│  │  │  │  └─ register/page.tsx
│  │  │  ├─ (dashboard)/        # protected app shell
│  │  │  │  ├─ layout.tsx               # RBAC-gated shell + sidebar
│  │  │  │  ├─ dashboard/page.tsx       # admin/team home (stats)
│  │  │  │  ├─ crm/
│  │  │  │  │  ├─ page.tsx              # pipeline board
│  │  │  │  │  └─ [leadId]/page.tsx     # lead detail
│  │  │  │  ├─ projects/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ [projectId]/page.tsx  # detail + Kanban
│  │  │  │  ├─ clients/page.tsx
│  │  │  │  ├─ invoices/page.tsx
│  │  │  │  └─ settings/page.tsx
│  │  │  └─ (portal)/           # CLIENT-only area
│  │  │     ├─ layout.tsx
│  │  │     └─ portal/
│  │  │        ├─ page.tsx
│  │  │        ├─ projects/page.tsx
│  │  │        ├─ files/page.tsx
│  │  │        ├─ invoices/page.tsx
│  │  │        └─ meetings/page.tsx
│  │  ├─ api/                   # Route Handlers
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ webhooks/stripe/route.ts
│  │  │  ├─ uploads/presign/route.ts
│  │  │  └─ health/route.ts
│  │  ├─ globals.css
│  │  └─ layout.tsx             # root (html lang/dir)
│  │
│  ├─ features/                 # ← domain modules (vertical slices)
│  │  ├─ auth/
│  │  │  ├─ actions.ts          # server actions
│  │  │  ├─ schema.ts           # zod
│  │  │  ├─ rbac.ts             # permission matrix + helpers
│  │  │  └─ components/
│  │  ├─ crm/
│  │  │  ├─ actions.ts
│  │  │  ├─ schema.ts
│  │  │  ├─ repository.ts       # LeadRepository
│  │  │  ├─ queries.ts          # react-query options
│  │  │  ├─ hooks/
│  │  │  └─ components/         # PipelineBoard, LeadCard, LeadForm...
│  │  ├─ projects/
│  │  │  ├─ actions.ts
│  │  │  ├─ schema.ts
│  │  │  ├─ repository.ts       # ProjectRepository, TaskRepository
│  │  │  ├─ queries.ts
│  │  │  └─ components/         # KanbanBoard, TaskCard, ProjectForm...
│  │  ├─ clients/
│  │  ├─ invoices/
│  │  ├─ meetings/
│  │  ├─ notifications/
│  │  ├─ files/                 # S3 presign + attachment helpers
│  │  └─ dashboard/             # stat aggregation, charts
│  │
│  ├─ components/               # shared, app-agnostic UI
│  │  ├─ ui/                    # shadcn primitives
│  │  ├─ layout/                # Sidebar, Topbar, Shell
│  │  ├─ marketing/             # Hero, FeatureGrid, Footer...
│  │  └─ providers/             # QueryProvider, ThemeProvider, IntlProvider
│  │
│  ├─ lib/                      # cross-cutting infrastructure
│  │  ├─ prisma.ts              # singleton client
│  │  ├─ auth.ts                # NextAuth config export
│  │  ├─ s3.ts                  # AWS SDK client + presign
│  │  ├─ resend.ts             # email client + templates
│  │  ├─ stripe.ts             # Stripe client
│  │  ├─ rbac.ts               # requireRole / requirePermission guards
│  │  ├─ env.ts                # zod-validated process.env
│  │  └─ utils.ts
│  │
│  ├─ i18n/
│  │  ├─ routing.ts             # locales: ['en','ar'], default 'en'
│  │  └─ request.ts
│  │
│  ├─ types/
│  └─ middleware.ts             # next-intl + auth route protection
├─ .env.example
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

## Layering rules (Clean Architecture)

```
app/ (routes)  →  features/*/actions.ts  →  features/*/repository.ts  →  lib/prisma.ts
   UI only          orchestration + auth        data access (Prisma)        DB
                     + zod validation            no auth/business logic
```

- **Route components** never call Prisma directly — they call Server Actions or
  read React Query data hydrated from actions/repositories.
- **Server Actions** validate input (Zod), enforce RBAC, then delegate to repositories.
- **Repositories** are the only place that import the Prisma client.
- **`lib/`** holds framework/infra adapters (DB, S3, Stripe, email, env).
