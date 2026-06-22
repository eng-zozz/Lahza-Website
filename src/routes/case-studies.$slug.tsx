import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/marketing/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCaseStudyBySlug } from "@/lib/case-studies";
import { ArrowRight, ArrowLeft, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/case-studies/$slug")({
  component: CaseStudyDetailPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border/60 py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function CaseStudyDetailPage() {
  const { slug } = Route.useParams();
  const { data: cs, isLoading } = useQuery({
    queryKey: ["case-study", slug],
    queryFn: () => fetchCaseStudyBySlug(slug),
  });

  if (isLoading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="h-10 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-secondary" />
        </div>
      </PublicShell>
    );
  }

  if (!cs) {
    return (
      <PublicShell>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-bold">Case study not found</h1>
          <p className="text-muted-foreground">
            This case study may have been unpublished or moved.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/case-studies">
              <ArrowLeft className="h-4 w-4" /> Back to case studies
            </Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        {cs.industry && <Badge variant="secondary">{cs.industry}</Badge>}
        <div className="mt-6 grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{cs.company_name}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{cs.summary}</p>
            {cs.client_name && (
              <p className="mt-3 text-sm text-muted-foreground">
                Client: <span className="font-medium text-foreground">{cs.client_name}</span>
              </p>
            )}
          </div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/40">
            {cs.logo_url ? (
              <img
                src={cs.logo_url}
                alt={`${cs.company_name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
            )}
          </div>
        </div>
      </section>

      {cs.challenge && (
        <Section title="Challenge">
          <p className="whitespace-pre-line text-muted-foreground">{cs.challenge}</p>
        </Section>
      )}

      {cs.solution && (
        <Section title="Solution">
          <p className="whitespace-pre-line text-muted-foreground">{cs.solution}</p>
          {cs.services.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {cs.services.map((s) => (
                <div
                  key={s}
                  className="rounded-xl border border-border bg-card p-4 text-sm font-medium"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {cs.technologies.length > 0 && (
        <Section title="Technologies Used">
          <div className="flex flex-wrap gap-3">
            {cs.technologies.map((t) => (
              <span key={t} className="rounded-full border border-border bg-card px-4 py-2 text-sm">
                {t}
              </span>
            ))}
          </div>
        </Section>
      )}

      {cs.metrics.length > 0 && (
        <Section title="Before / After">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cs.metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                  <span className="text-muted-foreground/70 line-through">{m.before}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span className="text-primary">{m.after}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {cs.results.length > 0 && (
        <Section title="Results">
          <ul className="grid gap-3 sm:grid-cols-2">
            {cs.results.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm"
              >
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cs.timeline && (
        <Section title="Project Timeline">
          <p className="whitespace-pre-line text-muted-foreground">{cs.timeline}</p>
        </Section>
      )}

      {cs.gallery_urls.length > 0 && (
        <Section title="Screenshots Gallery">
          <div className="grid gap-4 sm:grid-cols-3">
            {cs.gallery_urls.map((url) => (
              <div key={url} className="overflow-hidden rounded-2xl border border-border bg-card">
                <img src={url} alt="" className="h-40 w-full object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      <section className="border-t border-border/60 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Want results like these?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Let's design an automation system around your business.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/contact">
              Start a project <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}
