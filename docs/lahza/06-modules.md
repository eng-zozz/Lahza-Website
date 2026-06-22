# Module Specs (Phase 1)

## CRM — Drag-and-drop pipeline

**Route:** `/crm` (board) · `/crm/[leadId]` (detail)

- **Columns** = `LeadStatus`: New → Contacted → Qualified → Proposal → Won → Lost.
- **DnD:** `@dnd-kit/core` + `@dnd-kit/sortable`. On drop → `moveLead(id, status, position)`
  with optimistic React Query update; reorder `position` within column.
- **Lead card:** name, company, value badge, source tag, owner avatar.
- **Toolbar:** search (debounced `q`), filters (status, source, owner, value range).
- **Create/Edit:** dialog with `LeadForm` (Zod-validated).
- **Detail page:** full fields, notes timeline, activity, "Convert to Client" action
  (creates `User` CLIENT + `Client`, links `convertedClientId`).
- **Column footer:** count + summed `value`.

## Project Management — Kanban

**Route:** `/projects` (list/grid) · `/projects/[projectId]` (detail + board)

- **Project list:** cards with status, progress bar, client, manager, due date; filters.
- **Project CRUD:** dialog form (name, description, client, manager, dates, status).
- **Detail page tabs:** Overview · Board · Files · Invoices · Meetings.
- **Kanban board** columns = `TaskStatus`: Todo → In Progress → In Review → Done.
  - DnD via `@dnd-kit`; `moveTask(id, status, position)`.
  - Task card: title, priority badge, assignee avatar, due date, comment/attachment counts.
- **Task CRUD + assignment:** assignee select (team members), priority, deadline.
- **Comments:** threaded under task (`Comment`), realtime-ish via React Query refetch.
- **Attachments:** S3 presigned upload → `Attachment` row; mark `isDeliverable`.
- **Progress tracking:** `progress = done tasks / total tasks` recomputed on task change;
  surfaced on project card + detail.

## Client Portal

**Route group:** `/portal/*` (CLIENT role only)

| Page | Content |
|---|---|
| `/portal` | Overview: active projects, next meeting, unpaid invoices, notifications |
| `/portal/projects` | Read-only project list + progress; drill into status & deliverables |
| `/portal/files` | Upload files (S3) + download deliverables (`isDeliverable`) |
| `/portal/invoices` | Invoice list + status + "Pay" (Stripe Checkout) |
| `/portal/meetings` | Upcoming/past meetings with join links |

All queries scoped to `where: { client: { userId: session.user.id } }`.

## Admin Dashboard

**Route:** `/dashboard`

- **Stat cards:** total projects (by status), open leads + pipeline value, active clients,
  revenue (paid invoices this period) with MoM delta.
- **Charts:** revenue area chart, leads-by-stage bar, projects-by-status donut.
- **Recent activity:** unified feed (newest leads, tasks completed, invoices paid).
- **Quick actions:** new lead / project / invoice.
- Aggregation lives in `features/dashboard/repository.ts` (grouped Prisma queries).

## Billing (Phase 1 foundation)

- Invoices generated from projects; `InvoiceItem` line items.
- Stripe Checkout session per invoice; webhook (`app/api/webhooks/stripe`) flips
  `InvoiceStatus` to `PAID`, sets `paidAt`, creates `Notification`.
- Resend emails: invoice sent, payment received, overdue reminder.

## Notifications

- `Notification` rows created by domain events (task assigned, invoice paid, meeting set).
- Topbar bell with unread count; mark-as-read action; deep `link`.
