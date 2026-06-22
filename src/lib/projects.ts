import { supabase } from "@/integrations/supabase/client";

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "TESTING" | "DELIVERED" | "COMPLETED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  client_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  due_date: string | null;
  project_id: string;
  created_at: string;
}

export const PROJECT_STATUSES: { key: ProjectStatus; label: string }[] = [
  { key: "PLANNING", label: "Planning" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "TESTING", label: "Testing" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "COMPLETED", label: "Completed" },
];

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
];

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Project | null;
}

export interface ClientOption {
  id: string;
  label: string;
}

/** Staff: list clients for an assignment dropdown, labelled by company + contact name/email. */
export async function fetchClientOptions(): Promise<ClientOption[]> {
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, company, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const list = clients ?? [];
  if (list.length === 0) return [];

  const userIds = [...new Set(list.map((c) => c.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", userIds)
    : { data: [] as { id: string; name: string | null; email: string | null }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return list.map((c) => {
    const profile = c.user_id ? profileMap.get(c.user_id) : undefined;
    const contact = profile?.name || profile?.email;
    const label =
      c.company && contact ? `${c.company} — ${contact}` : c.company || contact || "Unnamed client";
    return { id: c.id, label };
  });
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  start_date?: string | null;
  due_date?: string | null;
  client_id?: string | null;
}

export async function updateProject(id: string, patch: ProjectUpdateInput) {
  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createProject(input: Partial<Project>) {
  const { error } = await supabase.from("projects").insert({
    name: input.name!,
    description: input.description ?? null,
    status: input.status ?? "PLANNING",
    due_date: input.due_date ?? null,
    client_id: input.client_id ?? null,
  });
  if (error) throw error;
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchTasks(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(input: Partial<Task>) {
  const { error } = await supabase.from("tasks").insert({
    title: input.title!,
    description: input.description ?? null,
    status: input.status ?? "TODO",
    priority: input.priority ?? "MEDIUM",
    project_id: input.project_id!,
    due_date: input.due_date ?? null,
  });
  if (error) throw error;
}

export async function updateTaskStatus(id: string, status: TaskStatus, position: number) {
  const { error } = await supabase.from("tasks").update({ status, position }).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function recomputeProgress(projectId: string, tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  await supabase.from("projects").update({ progress }).eq("id", projectId);
  return progress;
}
