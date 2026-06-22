import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/marketing/public-shell";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  Bot,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lahza — AI Automation for Modern Businesses" },
      {
        name: "description",
        content:
          "Lahza builds AI automation systems, chatbots, and business platforms that help companies save time and scale faster.",
      },
      { property: "og:title", content: "Lahza — AI Automation for Modern Businesses" },
      {
        property: "og:description",
        content: "AI automation systems, chatbots, and business platforms by Lahza.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Bot, title: "AI Automation", desc: "Automate repetitive work and free your team for what matters." },
  { icon: Users, title: "CRM & Leads", desc: "Capture, qualify, and track every lead in one clear pipeline." },
  { icon: FolderKanban, title: "Project Management", desc: "Plan and ship work with simple, visual boards." },
  { icon: ShieldCheck, title: "Client Portal", desc: "A branded space for your clients — projects, files, invoices." },
  { icon: Receipt, title: "Billing", desc: "Invoices and payments, connected to your projects." },
  { icon: Sparkles, title: "AI Content", desc: "Generate content and reports without lifting a finger." },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

function Index() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grid">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Business Automation
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
          >
            <span className="text-gradient">Run your business smarter, not harder</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
          >
            Lahza unifies your CRM, projects, client portal, and billing — powered by AI automation that does the busywork for you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="gap-2 shadow-[var(--shadow-glow)]">
              <Link to="/auth">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.h2 {...fadeUp} className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Everything your business needs
        </motion.h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to automate your business?</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Join businesses already running on Lahza.
            </p>
            <Button asChild size="lg" className="mt-8 gap-2 shadow-[var(--shadow-glow)]">
              <Link to="/auth">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </PublicShell>
  );
}
