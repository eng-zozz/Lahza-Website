# Authentication & RBAC

## 4 Roles

```
SUPER_ADMIN  → everything, incl. user management & billing config
ADMIN        → manage CRM, projects, clients, invoices, team
TEAM_MEMBER  → assigned projects/tasks, CRM read/write, no billing/user mgmt
CLIENT       → portal only: own projects, files, invoices, meetings
```

## Auth.js (NextAuth v5) config — `src/lib/auth.ts`

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },          // jwt → role available in middleware
  pages: { signIn: "/login" },
  providers: [
    Google,
    Credentials({
      async authorize(raw) {
        const { email, password } = loginSchema.parse(raw);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
```

Type augmentation in `src/types/next-auth.d.ts` adds `role` to `Session` and `JWT`.

## Permission matrix — `src/features/auth/rbac.ts`

```ts
import { Role } from "@prisma/client";

export const PERMISSIONS = {
  "lead:read":    [Role.SUPER_ADMIN, Role.ADMIN, Role.TEAM_MEMBER],
  "lead:write":   [Role.SUPER_ADMIN, Role.ADMIN, Role.TEAM_MEMBER],
  "project:read": [Role.SUPER_ADMIN, Role.ADMIN, Role.TEAM_MEMBER],
  "project:write":[Role.SUPER_ADMIN, Role.ADMIN, Role.TEAM_MEMBER],
  "client:manage":[Role.SUPER_ADMIN, Role.ADMIN],
  "invoice:manage":[Role.SUPER_ADMIN, Role.ADMIN],
  "user:manage":  [Role.SUPER_ADMIN],
  "portal:access":[Role.CLIENT],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, perm: Permission): boolean {
  return (PERMISSIONS[perm] as readonly Role[]).includes(role);
}
```

## Server guards — `src/lib/rbac.ts`

```ts
import { auth } from "@/lib/auth";
import { can, type Permission } from "@/features/auth/rbac";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requirePermission(perm: Permission) {
  const session = await requireAuth();
  if (!can((session.user as any).role, perm)) redirect("/unauthorized");
  return session;
}
```

Every Server Action begins with `await requirePermission("...")` before touching a repository.

## Route protection — `src/middleware.ts`

Combines `next-intl` locale routing with auth gating:

```ts
import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const intl = createIntlMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isApp    = /^\/(en|ar)\/(dashboard|crm|projects|clients|invoices)/.test(pathname);
  const isPortal = /^\/(en|ar)\/portal/.test(pathname);
  const role = (req.auth?.user as any)?.role;

  if ((isApp || isPortal) && !req.auth) {
    return Response.redirect(new URL("/login", req.url));
  }
  if (isApp && role === "CLIENT")      return Response.redirect(new URL("/portal", req.url));
  if (isPortal && role !== "CLIENT")   return Response.redirect(new URL("/dashboard", req.url));

  return intl(req);
});

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
```

## Auth flow

```
Register → bcrypt hash → create User(role) → (optional) create Client → email verify (Resend)
Login    → Credentials/Google → JWT { sub, role } → middleware reads role → route gate
Logout   → signOut() → clear session → redirect /login
Reset    → request token (VerificationToken) → Resend email → /reset-password → updateUser
```
