import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeads,
  createLead,
  updateLeadStatus,
  deleteLead,
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
  type LeadSource,
} from "@/lib/crm";
import {
  fetchClientsDirectory,
  fetchClientDetail,
  createClient,
  type ClientDirectoryEntry,
} from "@/lib/clients";
import { KanbanBoard } from "@/components/app/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Plus,
  Search,
  Trash2,
  MessageSquare,
  FolderKanban,
  Mail,
  Phone,
  Globe,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm")({
  component: CrmPage,
});

function CrmPage() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status, 0),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData<Lead[]>(["leads"]);
      qc.setQueryData<Lead[]>(["leads"], (old) =>
        (old ?? []).map((l) => (l.id === id ? { ...l, status } : l)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads"], ctx.prev);
      toast.error("Could not move lead");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const createMut = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead added");
      setOpen(false);
    },
    onError: () => toast.error("Could not add lead"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
  });

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      l.name.toLowerCase().includes(q) ||
      (l.company ?? "").toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q)
    );
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({
      name: String(fd.get("name")),
      company: String(fd.get("company") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      value: Number(fd.get("value") || 0),
      source: String(fd.get("source") || "WEBSITE") as LeadSource,
      status: String(fd.get("status") || "NEW") as LeadStatus,
      notes: String(fd.get("notes") || ""),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Manage your pipeline and your registered clients.
        </p>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Drag leads across stages to update their status.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads…"
                  className="w-52 ps-8"
                />
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5">
                    <Plus className="h-4 w-4" /> Lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Lead</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input name="name" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Company</Label>
                        <Input name="company" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Value ($)</Label>
                        <Input name="value" type="number" min="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input name="email" type="email" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input name="phone" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Stage</Label>
                        <Select name="status" defaultValue="NEW">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s.key} value={s.key}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Source</Label>
                        <Select name="source" defaultValue="WEBSITE">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["WEBSITE", "REFERRAL", "SOCIAL", "OUTBOUND", "EVENT", "OTHER"].map(
                              (s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Textarea name="notes" rows={2} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createMut.isPending}>
                        Add lead
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
            <KanbanBoard<Lead>
              columns={LEAD_STATUSES.map((s) => ({ key: s.key, label: s.label }))}
              items={filtered}
              getId={(l) => l.id}
              getColumn={(l) => l.status}
              onMove={(id, status) => moveMut.mutate({ id, status: status as LeadStatus })}
              columnFooter={(_k, items) => (
                <div className="text-xs text-muted-foreground">
                  ${items.reduce((s, l) => s + Number(l.value || 0), 0).toLocaleString()}
                </div>
              )}
              renderCard={(l) => (
                <div className="group space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{l.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMut.mutate(l.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  {l.company && <p className="text-xs text-muted-foreground">{l.company}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {l.source}
                    </span>
                    {Number(l.value) > 0 && (
                      <span className="text-xs font-semibold text-primary">
                        ${Number(l.value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientsTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients-directory"],
    queryFn: fetchClientsDirectory,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["client-detail", activeClientId],
    queryFn: () => fetchClientDetail(activeClientId!),
    enabled: !!activeClientId,
  });

  const createClientMut = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-directory"] });
      qc.invalidateQueries({ queryKey: ["client-options"] });
      toast.success("Client added");
      setAddOpen(false);
    },
    onError: () => toast.error("Could not add client"),
  });

  function handleAddClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createClientMut.mutate({
      company: String(fd.get("company") || ""),
      phone: String(fd.get("phone") || ""),
      website: String(fd.get("website") || ""),
      notes: String(fd.get("notes") || ""),
    });
    e.currentTarget.reset();
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-64 ps-8"
          />
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input name="company" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input name="phone" />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input name="website" placeholder="https://…" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea name="notes" rows={2} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createClientMut.isPending}>
                  Add client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <Users className="h-7 w-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No registered clients yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveClientId(c.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-start transition-colors hover:bg-accent/30"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(c.name ?? c.company ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.name ?? c.company ?? "Unnamed client"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.company ?? c.email ?? "—"}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {c.project_count} {c.project_count === 1 ? "project" : "projects"}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Client profile dialog */}
      <Dialog open={!!activeClientId} onOpenChange={(o) => !o && setActiveClientId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.name ?? detail?.company ?? "Client profile"}</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : detail ? (
            <div className="space-y-5">
              <div className="space-y-1.5 text-sm">
                {detail.company && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {detail.company}
                  </p>
                )}
                {detail.email && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {detail.email}
                  </p>
                )}
                {detail.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {detail.phone}
                  </p>
                )}
                {detail.website && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" /> {detail.website}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                  Projects {detail.projects.length > 0 && `(${detail.projects.length})`}
                </p>
                {detail.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects with this client yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.projects.map((p) => (
                      <Link
                        key={p.id}
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        onClick={() => setActiveClientId(null)}
                        className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:bg-accent/40"
                      >
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="outline">{p.status}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {detail.notes && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                    Notes
                  </p>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {detail.notes}
                  </p>
                </div>
              )}

              {detail.user_id && (
                <Button
                  className="w-full gap-1.5"
                  onClick={() => navigate({ to: "/inbox", search: { client: detail.user_id! } })}
                >
                  <MessageSquare className="h-4 w-4" /> Message this client
                </Button>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
