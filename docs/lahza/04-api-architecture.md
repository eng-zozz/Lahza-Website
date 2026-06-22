# API Architecture

## Principles

- **Server Actions** for all mutations and form submissions (progressive enhancement).
- **Route Handlers** (`app/api/*`) only for: NextAuth, Stripe webhooks, S3 presign, health.
- **Repository pattern**: the only layer importing Prisma.
- **Zod** validates at the action boundary; **React Query** caches reads on the client.

## Repository pattern — `src/features/crm/repository.ts`

```ts
import { prisma } from "@/lib/prisma";
import type { Prisma, LeadStatus } from "@prisma/client";

export const LeadRepository = {
  list(filter: { status?: LeadStatus; q?: string }) {
    return prisma.lead.findMany({
      where: {
        status: filter.status,
        OR: filter.q
          ? [{ name: { contains: filter.q, mode: "insensitive" } },
             { company: { contains: filter.q, mode: "insensitive" } },
             { email: { contains: filter.q, mode: "insensitive" } }]
          : undefined,
      },
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
  },
  byId: (id: string) => prisma.lead.findUnique({ where: { id } }),
  create: (data: Prisma.LeadCreateInput) => prisma.lead.create({ data }),
  update: (id: string, data: Prisma.LeadUpdateInput) =>
    prisma.lead.update({ where: { id }, data }),
  remove: (id: string) => prisma.lead.delete({ where: { id } }),

  // drag-and-drop: move card between/within columns
  async move(id: string, status: LeadStatus, position: number) {
    return prisma.lead.update({ where: { id }, data: { status, position } });
  },
};
```

## Zod schema — `src/features/crm/schema.ts`

```ts
import { z } from "zod";
import { LeadStatus, LeadSource } from "@prisma/client";

export const leadSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.nativeEnum(LeadStatus).default("NEW"),
  source: z.nativeEnum(LeadSource).default("WEBSITE"),
  value: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;
```

## Server Action — `src/features/crm/actions.ts`

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac";
import { leadSchema } from "./schema";
import { LeadRepository } from "./repository";

export async function createLead(input: unknown) {
  await requirePermission("lead:write");
  const data = leadSchema.parse(input);
  const lead = await LeadRepository.create(data);
  revalidatePath("/crm");
  return lead;
}

export async function moveLead(id: string, status: string, position: number) {
  await requirePermission("lead:write");
  const lead = await LeadRepository.move(id, status as any, position);
  revalidatePath("/crm");
  return lead;
}
```

## React Query options — `src/features/crm/queries.ts`

```ts
import { queryOptions } from "@tanstack/react-query";
import { listLeads } from "./actions";   // a read action

export const leadsQuery = (filter: { status?: string; q?: string }) =>
  queryOptions({
    queryKey: ["leads", filter],
    queryFn: () => listLeads(filter),
    staleTime: 30_000,
  });
```

Optimistic DnD: `useMutation({ mutationFn: moveLead, onMutate: ... })` updates the
cached board instantly, rolls back on error.

## Route Handlers

```
app/api/auth/[...nextauth]/route.ts   →  export { GET, POST } from handlers
app/api/webhooks/stripe/route.ts      →  verify signature, update Invoice, notify
app/api/uploads/presign/route.ts      →  requireAuth → S3 presigned PUT URL
app/api/health/route.ts               →  { ok: true } for Docker healthcheck
```

### S3 presign — `app/api/uploads/presign/route.ts`

```ts
import { requireAuth } from "@/lib/rbac";
import { getPresignedPutUrl } from "@/lib/s3";

export async function POST(req: Request) {
  await requireAuth();
  const { fileName, mimeType } = await req.json();
  const key = `uploads/${crypto.randomUUID()}/${fileName}`;
  const url = await getPresignedPutUrl(key, mimeType);
  return Response.json({ url, key });
}
```

Client uploads directly to S3 with the presigned URL, then a Server Action records
the `Attachment` row (`fileKey`, `size`, `mimeType`).
