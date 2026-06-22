import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchClientOptions,
  PROJECT_STATUSES,
  type ProjectStatus,
} from "@/lib/projects";
import { ClientCombobox } from "@/components/app/client-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

const statusLabel: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  TESTING: "Testing",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
  const { data: clientOptions = [] } = useQuery({
    queryKey: ["client-options"],
    queryFn: fetchClientOptions,
  });
  const [open, setOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setOpen(false);
    },
    onError: () => toast.error("Could not create project"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientId = String(fd.get("client_id") || "");
    createMut.mutate({
      name: String(fd.get("name")),
      description: String(fd.get("description") || ""),
      status: String(fd.get("status") || "PLANNING") as ProjectStatus,
      due_date: String(fd.get("due_date") || "") || null,
      client_id: clientId === "unassigned" ? null : clientId || null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage delivery across your client work.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea name="description" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <ClientCombobox name="client_id" options={clientOptions} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select name="status" defaultValue="PLANNING">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <Input name="due_date" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
          No projects yet. Create your first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{p.name}</h3>
                <button
                  onClick={() => deleteMut.mutate(p.id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              )}
              <Badge variant="secondary" className="mt-3 w-fit">
                {statusLabel[p.status]}
              </Badge>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {p.client_id
                  ? (clientOptions.find((c) => c.id === p.client_id)?.label ?? "Assigned client")
                  : "Unassigned"}
              </p>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{p.progress}%</span>
                </div>
                <Progress value={p.progress} />
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-4 w-fit gap-1.5 px-2">
                <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                  Open board <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
