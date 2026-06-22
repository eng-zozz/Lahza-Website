import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/marketing/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCaseStudies } from "@/lib/case-studies";
import { ArrowRight, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/case-studies/")({
  head: () => ({
    meta: [
      { title: "Case Studies | Lahza" },
      {
        name: "description",
        content:
          "Real results from real clients — see how Lahza's AI automation systems perform in production.",
      },
    ],
  }),
  component: CaseStudiesListPage,
});

function CaseStudiesListPage() {
  const { data: caseStudies = [], isLoading } = useQuery({
    queryKey: ["case-studies", "public"],
    queryFn: fetchCaseStudies,
  });

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <Badge variant="secondary">Case Studies</Badge>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Real results, real clients
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A look at the automation systems we've shipped, and the measurable impact they had.
        </p>
      </section>

      <section className="border-t border-border/60 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          ) : caseStudies.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Case studies are coming soon — check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {caseStudies.map((cs) => (
                <Link
                  key={cs.id}
                  to="/case-studies/$slug"
                  params={{ slug: cs.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <div className="flex h-44 items-center justify-center overflow-hidden bg-secondary/40">
                    {cs.logo_url ? (
                      <img
                        src={cs.logo_url}
                        alt={cs.company_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    {cs.industry && (
                      <Badge variant="secondary" className="w-fit">
                        {cs.industry}
                      </Badge>
                    )}
                    <h2 className="text-lg font-semibold">{cs.company_name}</h2>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{cs.summary}</p>
                    <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                      Read case study
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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
