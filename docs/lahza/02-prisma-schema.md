# Prisma Schema

`prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────── ENUMS ───────────────────────────

enum Role {
  SUPER_ADMIN
  ADMIN
  TEAM_MEMBER
  CLIENT
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL
  WON
  LOST
}

enum LeadSource {
  WEBSITE
  REFERRAL
  SOCIAL
  OUTBOUND
  EVENT
  OTHER
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  TESTING
  DELIVERED
  COMPLETED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  VOID
}

enum MeetingStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}

enum NotificationType {
  SYSTEM
  PROJECT
  TASK
  INVOICE
  MEETING
  LEAD
}

// ─────────────────────────── AUTH / RBAC ───────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?                      // null when OAuth-only
  role          Role      @default(TEAM_MEMBER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Auth.js relations
  accounts      Account[]
  sessions      Session[]

  // domain relations
  permissions   UserPermission[]
  clientProfile Client?           // when role = CLIENT
  ownedProjects Project[]         @relation("ProjectManager")
  assignedTasks Task[]            @relation("TaskAssignee")
  comments      Comment[]
  uploads       Attachment[]
  notifications Notification[]
  organizedMeetings Meeting[]     @relation("MeetingOrganizer")

  @@index([role])
}

model Permission {
  id          String           @id @default(cuid())
  key         String           @unique        // e.g. "lead:create"
  description String?
  users       UserPermission[]
}

// explicit join → per-user permission overrides on top of role defaults
model UserPermission {
  userId       String
  permissionId String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([userId, permissionId])
}

// Auth.js (NextAuth) standard models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─────────────────────────── CRM ───────────────────────────

model Lead {
  id        String     @id @default(cuid())
  name      String
  company   String?
  email     String?
  phone     String?
  status    LeadStatus @default(NEW)
  source    LeadSource @default(WEBSITE)
  value     Decimal    @default(0) @db.Decimal(12, 2)
  notes     String?
  position  Int        @default(0)            // ordering within a pipeline column
  ownerId   String?
  owner     User?      @relation("LeadOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  convertedClientId String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([status])
  @@index([ownerId])
}

// ─────────────────────────── CLIENTS ───────────────────────────

model Client {
  id        String    @id @default(cuid())
  userId    String    @unique               // links portal login
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   String?
  phone     String?
  website   String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  projects  Project[]
  invoices  Invoice[]
  meetings  Meeting[]
}

// ─────────────────────────── PROJECTS / TASKS ───────────────────────────

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(PLANNING)
  progress    Int           @default(0)       // 0–100, derived from tasks
  startDate   DateTime?
  dueDate     DateTime?
  clientId    String?
  client      Client?       @relation(fields: [clientId], references: [id], onDelete: SetNull)
  managerId   String?
  manager     User?         @relation("ProjectManager", fields: [managerId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  tasks       Task[]
  invoices    Invoice[]
  attachments Attachment[]
  meetings    Meeting[]

  @@index([status])
  @@index([clientId])
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  position    Int          @default(0)         // ordering within Kanban column
  dueDate     DateTime?
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  comments    Comment[]
  attachments Attachment[]

  @@index([projectId, status])
  @@index([assigneeId])
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([taskId])
}

model Attachment {
  id         String   @id @default(cuid())
  fileName   String
  fileKey    String                          // S3 object key
  fileUrl    String?                         // optional CDN/public URL
  mimeType   String?
  size       Int?
  isDeliverable Boolean @default(false)      // client-downloadable
  uploadedById String?
  uploadedBy User?    @relation(fields: [uploadedById], references: [id], onDelete: SetNull)
  projectId  String?
  project    Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId     String?
  task       Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@index([projectId])
  @@index([taskId])
}

// ─────────────────────────── BILLING ───────────────────────────

model Invoice {
  id          String        @id @default(cuid())
  number      String        @unique           // e.g. INV-2025-0001
  status      InvoiceStatus @default(DRAFT)
  amount      Decimal       @db.Decimal(12, 2)
  currency    String        @default("USD")
  dueDate     DateTime?
  issuedAt    DateTime?
  paidAt      DateTime?
  stripeInvoiceId       String? @unique
  stripePaymentIntentId String?
  clientId    String
  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  projectId   String?
  project     Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  items       InvoiceItem[]

  @@index([clientId])
  @@index([status])
}

model InvoiceItem {
  id          String  @id @default(cuid())
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int     @default(1)
  unitPrice   Decimal @db.Decimal(12, 2)
}

// ─────────────────────────── MEETINGS / NOTIFICATIONS ───────────────────────────

model Meeting {
  id          String        @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime?
  location    String?                         // URL or place
  status      MeetingStatus @default(SCHEDULED)
  organizerId String?
  organizer   User?         @relation("MeetingOrganizer", fields: [organizerId], references: [id], onDelete: SetNull)
  clientId    String?
  client      Client?       @relation(fields: [clientId], references: [id], onDelete: SetNull)
  projectId   String?
  project     Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now())

  @@index([startTime])
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType @default(SYSTEM)
  title     String
  body      String?
  link      String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId, isRead])
}
```

## Relationship summary

```
User 1─1 Client (CLIENT role)        Client 1─* Project 1─* Task 1─* Comment
User 1─* Project (manager)           Project 1─* Invoice *─1 Client
User 1─* Task   (assignee)           Project/Task 1─* Attachment
User 1─* Lead   (owner)              Client 1─* Meeting
User *─* Permission (UserPermission) User 1─* Notification
Invoice 1─* InvoiceItem
```

Add via migrations: `npx prisma migrate dev --name init`, then `prisma db seed`.
