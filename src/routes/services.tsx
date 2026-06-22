import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/marketing/public-shell";
import { Megaphone, Code2, Palette, Bot, LineChart, Search, Facebook } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Lahza" },
      { name: "description", content: "AI automation, web, design, and growth services for modern businesses." },
      { property: "og:title", content: "Services — Lahza" },
      { property: "og:description", content: "End-to-end automation services by Lahza." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Facebook, title: "Auto Facebook Groups Poster", desc: "One of our flagship automations — schedules and posts your content across Facebook groups automatically, no manual work." },
  { icon: Bot, title: "AI Automation", desc: "Custom workflows that remove busywork and unlock leverage." },
  { icon: Code2, title: "Web & Product", desc: "Fast, modern websites and apps built to convert." },
  { icon: Palette, title: "Brand & Design", desc: "Identity and interfaces that make your brand unmistakable." },
  { icon: Megaphone, title: "Marketing", desc: "Campaigns that drive demand and fill your pipeline." },
  { icon: Search, title: "SEO & Content", desc: "Organic growth that compounds over time." },
  { icon: LineChart, title: "Growth & Analytics", desc: "Data-driven decisions that maximize ROI." },
];

function ServicesPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Services</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            One partner for everything your business needs to run smarter.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
