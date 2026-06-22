import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, type ProjectStatus } from "@/lib/projects";
import { useAuth } from "@/lib/auth-context";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalPage,
});

const statusLabel: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  TESTING: "Testing",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

function PortalPage() {
  const { user } = useAuth();
  // RLS scopes projects to the signed-in client's own records automatically.
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["portal-projects"],
    queryFn: fetchProjects,
  });

  const active = projects.filter((p) => !["COMPLETED"].includes(p.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="text-sm text-muted-foreground">Active projects</span>
          <div className="mt-2 text-3xl font-bold">{active.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="text-sm text-muted-foreground">Total projects</span>
          <div className="mt-2 text-3xl font-bold">{projects.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="text-sm text-muted-foreground">Completed</span>
          <div className="mt-2 text-3xl font-bold">{projects.filter((p) => p.status === "COMPLETED").length}</div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Your projects</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            <FolderKanban className="mx-auto mb-3 h-8 w-8 opacity-50" />
            No projects shared with you yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  <Badge variant="secondary">{statusLabel[p.status]}</Badge>
                </div>
                {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span>{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} />
                </div>
                {p.due_date && <p className="mt-3 text-xs text-muted-foreground">Due {p.due_date}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
