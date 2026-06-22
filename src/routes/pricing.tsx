import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/marketing/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, TrendingUp, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lahza" },
      { name: "description", content: "AI automation packages for businesses of every size." },
      { property: "og:title", content: "Pricing — Lahza" },
      { property: "og:description", content: "AI automation packages built around your business." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Starter",
    price: "8,000",
    desc: "For small businesses automating customer communication and leads.",
    features: [
      "AI chatbot — website, WhatsApp & social",
      "Automated support responses",
      "Lead collection & management",
      "Basic CRM automation",
      "Data entry automation",
      "AI content generation",
    ],
    impact: "Automates 30–40% of repetitive tasks · saves 40–80 hrs/month",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "16,000",
    desc: "For growing companies automating sales, marketing & operations.",
    features: [
      "Everything in Starter",
      "Auto Facebook groups poster",
      "Customer sentiment analysis",
      "Email marketing automation",
      "AI lead qualification & scoring",
      "Meeting recording & AI summaries",
      "CRM pipeline automation",
    ],
    impact: "Automates 50–70% of operations · saves 100–200 hrs/month",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "30,000",
    desc: "A complete AI-powered automation system for scaling businesses.",
    features: [
      "Everything in Growth",
      "Advanced AI support agent",
      "AI lead scraping & enrichment",
      "Automated cold outreach",
      "Internal knowledge base AI",
      "Custom AI systems & consulting",
    ],
    impact: "Automates 80–95% of processes · saves 250+ hrs/month",
    highlighted: false,
  },
];

// Everything we do, available individually in the Custom package.
const ALL_FEATURES = [
  "Auto Facebook groups poster automation",
  "AI chatbot — website, WhatsApp & social",
  "Automated support responses",
  "Lead collection & management",
  "Basic CRM automation",
  "Data entry automation",
  "AI content generation",
  "Customer sentiment analysis",
  "Email marketing automation",
  "AI lead qualification & scoring",
  "Meeting recording & AI summaries",
  "CRM pipeline automation",
  "Advanced AI support agent",
  "AI lead scraping & enrichment",
  "Automated cold outreach",
  "Internal knowledge base AI",
  "Custom website / web app",
  "Branding & design",
  "SEO & content",
  "Growth & analytics dashboards",
  "Custom AI systems & consulting",
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

function PricingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [extra, setExtra] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleFeature(feature: string) {
    setSelected((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature],
    );
  }

  // Sends the visitor to talk to us about the package they picked —
  // never drops them straight into the dashboard.
  function goToContact(packageName: string) {
    navigate({ to: "/contact", search: { package: packageName } });
  }

  async function submitCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please add your name and email.");
      return;
    }
    setLoading(true);
    try {
      const lines = [
        "Custom package request",
        selected.length ? `Wants: ${selected.join(", ")}` : "No specific features selected yet.",
        extra ? `Notes: ${extra}` : "",
      ].filter(Boolean);
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: lines.join("\n") }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Sent! We'll reach out to build your custom package.");
      setSelected([]);
      setExtra("");
      setName("");
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">AI Automation Packages</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Pick the level of automation your business needs. Upgrade anytime.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative flex flex-col rounded-2xl border bg-card p-8 ${
                tier.highlighted ? "border-primary shadow-[var(--shadow-glow)]" : "border-border"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tier.desc}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">EGP / month</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {tier.impact}
              </div>

              <Button
                className="mt-6 w-full"
                variant={tier.highlighted ? "default" : "outline"}
                onClick={() => goToContact(tier.name)}
              >
                Get started
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Custom package — pick exactly what you want, we follow up as a lead */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 rounded-2xl border border-primary/30 bg-card p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Custom</h3>
                <p className="text-sm text-muted-foreground">
                  Everything we build, in one place. Pick exactly what you need — we'll price and
                  scope it around you.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submitCustom} className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Choose what you want
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {ALL_FEATURES.map((feature) => (
                  <label
                    key={feature}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background/50 p-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <Checkbox
                      checked={selected.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                      className="mt-0.5"
                    />
                    {feature}
                  </label>
                ))}
              </div>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="custom-notes">Anything else? (optional)</Label>
                <Textarea
                  id="custom-notes"
                  rows={2}
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Tell us anything specific you need that's not listed above…"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Your details
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="custom-name">Name</Label>
                <Input
                  id="custom-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-email">Email</Label>
                <Input
                  id="custom-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send my custom request"}
              </Button>
              <p className="text-xs text-muted-foreground">
                This goes straight to our team as a lead — we'll get back to you with pricing.
              </p>
            </div>
          </form>
        </motion.div>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground"
        >
          Need something custom? <Link to="/contact" className="text-primary hover:underline">Talk to us</Link> about a tailored automation system.
        </motion.p>
      </section>
    </PublicShell>
  );
}
