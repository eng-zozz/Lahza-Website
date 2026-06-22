import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProject,
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  recomputeProgress,
  updateProject,
  fetchClientOptions,
  TASK_STATUSES,
  PROJECT_STATUSES,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type ProjectStatus,
} from "@/lib/projects";
import { KanbanBoard } from "@/components/app/kanban";
import { ClientCombobox } from "@/components/app/client-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, ArrowLeft, Settings2, Calendar, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetailPage,
});

const priorityColor: Record<TaskPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-primary/15 text-primary",
  HIGH: "bg-orange-500/20 text-orange-400",
  URGENT: "bg-destructive/20 text-destructive",
};

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
  });
  const { data: clientOptions = [] } = useQuery({
    queryKey: ["client-options"],
    queryFn: fetchClientOptions,
  });

  const updateProjectMut = useMutation({
    mutationFn: (patch: Parameters<typeof updateProject>[1]) => updateProject(projectId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      setSettingsOpen(false);
    },
    onError: () => toast.error("Could not update project"),
  });

  function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientId = String(fd.get("client_id") || "");
    updateProjectMut.mutate({
      name: String(fd.get("name")),
      description: String(fd.get("description") || "") || null,
      status: String(fd.get("status")) as ProjectStatus,
      start_date: String(fd.get("start_date") || "") || null,
      due_date: String(fd.get("due_date") || "") || null,
      client_id: clientId === "unassigned" ? null : clientId || null,
    });
  }

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status, 0),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tasks", projectId] });
      const prev = qc.getQueryData<Task[]>(["tasks", projectId]);
      qc.setQueryData<Task[]>(["tasks", projectId], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", projectId], ctx.prev);
      toast.error("Could not move task");
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      const fresh = await fetchTasks(projectId);
      await recomputeProgress(projectId, fresh);
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const createMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task added");
      setOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({
      title: String(fd.get("title")),
      description: String(fd.get("description") || ""),
      priority: String(fd.get("priority") || "MEDIUM") as TaskPriority,
      status: String(fd.get("status") || "TODO") as TaskStatus,
      due_date: String(fd.get("due_date") || "") || null,
      project_id: projectId,
    });
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
        <Link to="/projects">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project?.name ?? "Project"}</h1>
          {project?.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {project?.status && (
              <Badge variant="secondary">
                {PROJECT_STATUSES.find((s) => s.key === project.status)?.label ?? project.status}
              </Badge>
            )}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {project?.client_id
                ? (clientOptions.find((c) => c.id === project.client_id)?.label ??
                  "Assigned client")
                : "Unassigned"}
            </span>
            {project?.due_date && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Due {project.due_date}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Settings2 className="h-4 w-4" /> Project Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Project Settings</DialogTitle>
              </DialogHeader>
              {project && (
                <form key={project.id} onSubmit={handleSaveSettings} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input name="name" defaultValue={project.name} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      rows={3}
                      defaultValue={project.description ?? ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select name="status" defaultValue={project.status}>
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
                      <Label>Client</Label>
                      <ClientCombobox
                        name="client_id"
                        options={clientOptions}
                        defaultValue={project.client_id ?? "unassigned"}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Start date</Label>
                      <Input
                        name="start_date"
                        type="date"
                        defaultValue={project.start_date ?? ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due date</Label>
                      <Input name="due_date" type="date" defaultValue={project.due_date ?? ""} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={updateProjectMut.isPending}>
                      Save changes
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" /> Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input name="title" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea name="description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select name="status" defaultValue="TODO">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select name="priority" defaultValue="MEDIUM">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <Input name="due_date" type="date" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending}>
                    Add task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <KanbanBoard<Task>
          columns={TASK_STATUSES.map((s) => ({ key: s.key, label: s.label }))}
          items={tasks}
          getId={(t) => t.id}
          getColumn={(t) => t.status}
          onMove={(id, status) => moveMut.mutate({ id, status: status as TaskStatus })}
          renderCard={(t) => (
            <div className="group space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{t.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMut.mutate(t.id);
                  }}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {t.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor[t.priority]}`}
                >
                  {t.priority}
                </span>
                {t.due_date && (
                  <span className="text-[10px] text-muted-foreground">{t.due_date}</span>
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
