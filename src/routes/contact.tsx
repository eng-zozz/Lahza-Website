import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/marketing/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";

const contactSearchSchema = z.object({
  package: z.string().optional(),
});

export const Route = createFileRoute("/contact")({
  validateSearch: contactSearchSchema,
  head: () => ({
    meta: [
      { title: "Contact — Lahza" },
      { name: "description", content: "Get in touch with the Lahza team. Let's build something great." },
      { property: "og:title", content: "Contact — Lahza" },
      { property: "og:description", content: "Reach out and start a project with Lahza." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { package: packageName } = Route.useSearch();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const rawMessage = String(fd.get("message") ?? "");
    const message = packageName
      ? `Interested in: ${packageName} package\n${rawMessage}`.trim()
      : rawMessage;
    setLoading(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
          message,
        }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Thanks! We'll be in touch soon.");
      form.reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Let's talk</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {packageName
              ? `Great choice — tell us a bit more and we'll set up your ${packageName} package.`
              : "Tell us about your agency and what you want to build. We usually reply within one business day."}
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li>
              <a href={BRAND.phoneHref} dir="ltr" className="flex items-center gap-3 hover:text-primary">
                <Phone className="h-5 w-5 text-primary" /> {BRAND.phone}
              </a>
            </li>
            <li>
              <a href={BRAND.emailHref} className="flex items-center gap-3 hover:text-primary">
                <Mail className="h-5 w-5 text-primary" /> {BRAND.email}
              </a>
            </li>
            <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> {BRAND.location}</li>
          </ul>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href={BRAND.phoneHref}
              dir="ltr"
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <Phone className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm text-muted-foreground">Call us</div>
              <div className="font-semibold">{BRAND.phone}</div>
            </a>
            <a
              href={BRAND.emailHref}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <Mail className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm text-muted-foreground">Email us</div>
              <div className="font-semibold">{BRAND.email}</div>
            </a>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          {packageName && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
              Interested in the <strong>{packageName}</strong> package
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" placeholder="Company (optional)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={4} placeholder="What can we help with?" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>
      </section>
    </PublicShell>
  );
}
