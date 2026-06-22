import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/marketing/public-shell";
import { motion } from "framer-motion";
import {
  Bot,
  MessageSquare,
  Filter,
  LayoutGrid,
  Globe,
  Workflow,
  Target,
  Sparkles,
  ShieldCheck,
  Facebook,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Lahza" },
      { name: "description", content: "Lahza builds AI automation systems and intelligent platforms that help businesses scale." },
      { property: "og:title", content: "About — Lahza" },
      { property: "og:description", content: "Building intelligent systems that move businesses forward." },
    ],
  }),
  component: AboutPage,
});

const services = [
  { icon: Facebook, title: "Auto Facebook Groups Poster", desc: "One of our flagship builds — automatically posts your content across Facebook groups on a schedule, no manual posting needed." },
  { icon: Bot, title: "AI Automation", desc: "Automate repetitive operations with intelligent workflows." },
  { icon: MessageSquare, title: "AI Chatbots", desc: "WhatsApp, Messenger, and website bots that work around the clock." },
  { icon: Filter, title: "Lead Qualification", desc: "Qualify and organize leads automatically before sales sees them." },
  { icon: LayoutGrid, title: "Business Platforms", desc: "Custom CRM and operations tools built around your workflow." },
  { icon: Globe, title: "Smart Websites", desc: "Modern sites connected to automation and analytics." },
  { icon: Workflow, title: "Process Optimization", desc: "Turn manual work into scalable automated systems." },
];

const reasons = [
  "Custom-built solutions",
  "AI-first methodology",
  "Measurable results",
  "Transparent communication",
  "Continuous optimization",
];

const founders = [
  {
    name: "Mohammed Ayman",
    role: "Founder — Sales & Operations",
    desc: "Leads sales and runs day-to-day agency operations.",
  },
  {
    name: "George Adel",
    role: "Co-Founder — Technical Lead",
    desc: "Leads the technical side, building the automation systems we ship.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

function AboutPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold uppercase tracking-wider text-primary"
        >
          About Lahza
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
        >
          Intelligent systems that move businesses forward
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg text-muted-foreground"
        >
          Lahza helps businesses save time and scale faster through AI automation — connecting
          customer communication, marketing, and operations into one seamless system.
        </motion.p>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <motion.h2 {...fadeUp} className="text-2xl font-bold tracking-tight sm:text-3xl">
            What We Do
          </motion.h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <s.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-8">
            <Target className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-semibold">Our Vision</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              To be a global leader in business automation — helping organizations operate
              smarter and scale without limits.
            </p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="rounded-2xl border border-border bg-card p-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-semibold">Our Approach</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              We start with your business, not the technology. We find the bottlenecks, then
              build the system that removes them.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <motion.h2 {...fadeUp} className="text-2xl font-bold tracking-tight sm:text-3xl">
            Why Businesses Choose Lahza
          </motion.h2>
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="mt-8 flex flex-wrap gap-3">
            {reasons.map((r) => (
              <span
                key={r}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"
              >
                <ShieldCheck className="h-4 w-4 text-primary" /> {r}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.h2 {...fadeUp} className="text-2xl font-bold tracking-tight sm:text-3xl">
          Founders
        </motion.h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {founders.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                {f.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.name}</h3>
              <p className="text-sm text-primary">{f.role}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
