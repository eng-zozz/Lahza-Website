# Deployment

## Environment variables — `.env.example`

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://lahza.ai

# Database (PostgreSQL)
DATABASE_URL=postgresql://lahza:password@db:5432/lahza?schema=public

# Auth.js
AUTH_SECRET=                      # openssl rand -base64 32
AUTH_URL=https://lahza.ai
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# AWS S3
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=lahza-uploads

# Resend
RESEND_API_KEY=
EMAIL_FROM=no-reply@lahza.ai

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Validate at boot with `src/lib/env.ts` (Zod) so missing vars fail fast.

## Dockerfile — `docker/Dockerfile`

```dockerfile
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
```

Requires `output: "standalone"` in `next.config.ts`.

## docker-compose — `docker/docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lahza
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lahza
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lahza"]
      interval: 5s

  web:
    build: { context: .., dockerfile: docker/Dockerfile }
    env_file: ../.env
    depends_on:
      db: { condition: service_healthy }
    ports: ["3000:3000"]
    command: sh -c "npx prisma migrate deploy && node server.js"

volumes:
  pgdata:
```

## Vercel

- Connect repo; set all env vars in Project Settings.
- Use a managed Postgres (Neon / Supabase / RDS) for `DATABASE_URL`.
- Build command: `prisma generate && next build`.
- Add `prisma migrate deploy` as a release/post-deploy step (or run from CI).
- Stripe webhook endpoint → `https://lahza.ai/api/webhooks/stripe`.

## CI (GitHub Actions, suggested)

```
lint → typecheck → prisma validate → build → (on main) deploy
```
