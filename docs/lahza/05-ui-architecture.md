# UI Architecture

## Design tokens — `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: 240 18% 6%;       /* #0A0A12 */
  --foreground: 0 0% 98%;
  --primary: 75 87% 56%;         /* #C7F02D */
  --primary-foreground: 240 18% 6%;
  --muted: 240 10% 14%;
  --muted-foreground: 240 5% 65%;
  --card: 240 14% 9%;
  --border: 240 10% 18%;
  --ring: 75 87% 56%;
  --radius: 0.75rem;
}

html[dir="rtl"] { /* logical props handle most flipping automatically */ }
```

Use HSL CSS variables → Tailwind `bg-primary`, `text-foreground`, etc. Never hardcode
`#C7F02D` or `text-white` in components.

## shadcn/ui primitives

`button`, `card`, `input`, `select`, `dialog`, `dropdown-menu`, `tabs`, `badge`,
`avatar`, `table`, `sheet`, `sonner` (toasts), `form`, `tooltip`, `skeleton`.
Add a `hero` and `lime` button variant in `button.tsx`.

## Marketing components — `src/components/marketing/`

```
Hero            full-bleed dark, lime gradient orb, animated headline (Framer Motion)
LogoCloud       client/tech logos marquee
FeatureGrid     services cards w/ icon + hover lift
StatsBand       animated counters
CaseStudyCard   image, result metric, tag
PricingTable    3 tiers, monthly/annual toggle, highlighted plan
Testimonials    carousel
CTASection      lime CTA band
Footer          columns + locale switch
Navbar          sticky, transparent→solid on scroll, EN/AR toggle
```

Framer Motion: `motion.div` entrance (`opacity/y`), `whileInView` scroll reveals,
`AnimatePresence` for route/locale transitions, `layout` for Kanban/pipeline DnD.

## Internationalization (next-intl)

`src/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
});
```

Root layout sets direction:

```tsx
export default function RootLayout({ children, params: { locale } }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
```

- Translations in `messages/en.json` + `messages/ar.json`.
- Components read copy via `useTranslations()` / `getTranslations()`.
- Use Tailwind **logical** utilities (`ps-4`, `pe-4`, `ms-auto`, `text-start`) so RTL
  mirrors automatically.
- Arabic font (e.g. `IBM Plex Sans Arabic`) loaded conditionally per locale.

## Dashboard layouts

### App shell — `(dashboard)/layout.tsx`
```
┌────────────────────────────────────────────┐
│ Topbar: search · notifications · avatar     │
├──────────┬─────────────────────────────────┤
│ Sidebar  │  <main> route content            │
│ (RBAC-   │                                  │
│  filtered│                                  │
│  nav)    │                                  │
└──────────┴─────────────────────────────────┘
```
Sidebar items filtered by `can(role, perm)`. Collapsible to icon rail.

### Admin dashboard — `dashboard/page.tsx`
- **Stat cards**: Projects · Leads · Clients · Revenue (with trend deltas).
- **Charts** (Recharts): revenue over time (area), leads by stage (bar),
  projects by status (donut).
- **Recent activity** feed (latest tasks, leads, invoices).

### Client portal shell — `(portal)/layout.tsx`
Simplified nav: Overview · Projects · Files · Invoices · Meetings · Notifications.
Lime-accented, no admin tooling.

## Providers — `src/components/providers/`
- `QueryProvider` (TanStack Query client + Devtools in dev)
- `NextIntlClientProvider`
- `ThemeProvider` (dark default)
- `Toaster` (sonner)
