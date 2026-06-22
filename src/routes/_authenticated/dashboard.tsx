import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { fetchLeads } from "@/lib/crm";
import { fetchProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  FolderKanban,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Inbox,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const PIE_COLORS = ["#C7F02D", "#7CC4D6", "#E0B341", "#C77DFF", "#FF6B6B"];

const STATUS_ICON: Record<string, React.ElementType> = {
  PLANNING: Circle,
  IN_PROGRESS: Clock,
  TESTING: AlertCircle,
  DELIVERED: CheckCircle2,
  COMPLETED: CheckCircle2,
};

const STATUS_COLOR: Record<string, string> = {
  PLANNING: "text-muted-foreground",
  IN_PROGRESS: "text-primary",
  TESTING: "text-yellow-400",
  DELIVERED: "text-blue-400",
  COMPLETED: "text-emerald-400",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-muted text-muted-foreground",
  CONTACTED: "bg-blue-500/15 text-blue-400",
  QUALIFIED: "bg-yellow-500/15 text-yellow-400",
  PROPOSAL: "bg-purple-500/15 text-purple-400",
  WON: "bg-emerald-500/15 text-emerald-400",
  LOST: "bg-destructive/15 text-destructive",
};

// Fake sparkline data for visual interest — replace with real time-series when available
const sparklineData = [
  { v: 4 },
  { v: 6 },
  { v: 5 },
  { v: 8 },
  { v: 7 },
  { v: 10 },
  { v: 9 },
  { v: 12 },
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  trend?: { dir: "up" | "down"; text: string };
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-shadow hover:shadow-lg",
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      {/* Subtle background glow on accent card */}
      {accent && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
      )}

      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl",
            accent ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend.dir === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span
            className={cn(
              "font-medium",
              trend.dir === "up" ? "text-emerald-400" : "text-destructive",
            )}
          >
            {trend.text}
          </span>
        </div>
      )}

      {/* Micro sparkline */}
      <div className="pointer-events-none absolute bottom-0 end-0 h-12 w-24 opacity-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={accent ? "#C7F02D" : "#888"}
              strokeWidth={1.5}
              fill={accent ? "#C7F02D" : "#888"}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action && (
        <Link
          to={action.to}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          {action.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { isStaff, isClient, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && isClient && !isStaff) navigate({ to: "/portal", replace: true });
  }, [loading, isClient, isStaff, navigate]);

  const leadsQ = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const clientsQ = useQuery({
    queryKey: ["clients-count"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const leads = leadsQ.data ?? [];
  const projects = projectsQ.data ?? [];

  const openLeads = leads.filter((l) => !["WON", "LOST"].includes(l.status));
  const pipelineValue = leads
    .filter((l) => l.status !== "LOST")
    .reduce((sum, l) => sum + Number(l.value || 0), 0);

  const recentLeads = leads.slice(0, 5);
  const recentProjects = projects.slice(0, 4);

  const leadsByStage = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"].map((s) => ({
    stage: s.charAt(0) + s.slice(1).toLowerCase(),
    count: leads.filter((l) => l.status === s).length,
  }));

  const projectsByStatus = ["PLANNING", "IN_PROGRESS", "TESTING", "DELIVERED", "COMPLETED"]
    .map((s) => ({
      name: s.replace("_", " "),
      value: projects.filter((p) => p.status === s).length,
    }))
    .filter((d) => d.value > 0);

  const isLoadingAny = leadsQ.isLoading || projectsQ.isLoading || clientsQ.isLoading;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening across your agency today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/crm">
              <Plus className="me-1.5 h-3.5 w-3.5" />
              New Lead
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/projects">
              <Plus className="me-1.5 h-3.5 w-3.5" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={
            isLoadingAny ? "—" : String(projects.filter((p) => p.status !== "COMPLETED").length)
          }
          sub={`${projects.length} total`}
          trend={{ dir: "up", text: "2 this week" }}
        />
        <StatCard
          icon={Users}
          label="Open Leads"
          value={isLoadingAny ? "—" : String(openLeads.length)}
          sub={`${leads.length} total in pipeline`}
        />
        <StatCard
          icon={Briefcase}
          label="Clients"
          value={isLoadingAny ? "—" : String(clientsQ.data ?? 0)}
          sub="Active accounts"
          trend={{ dir: "up", text: "growing" }}
        />
        <StatCard
          icon={DollarSign}
          label="Pipeline Value"
          value={isLoadingAny ? "—" : `$${pipelineValue.toLocaleString()}`}
          sub="Open + qualified"
          accent
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <SectionHeader title="Leads by stage" action={{ label: "View CRM", to: "/crm" }} />
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadsByStage} barSize={24}>
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.02 280)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.02 280)" }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{
                    background: "oklch(0.17 0.02 280)",
                    border: "1px solid oklch(0.27 0.02 280)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.9 0.21 122)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <SectionHeader
            title="Projects by status"
            action={{ label: "View projects", to: "/projects" }}
          />
          <div className="mt-4">
            {projectsByStatus.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2">
                <FolderKanban className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No projects yet.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/projects">
                    <Plus className="me-1.5 h-3.5 w-3.5" />
                    Create first project
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={projectsByStatus}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={82}
                      innerRadius={48}
                      paddingAngle={3}
                    >
                      {projectsByStatus.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.17 0.02 280)",
                        border: "1px solid oklch(0.27 0.02 280)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {projectsByStatus.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="flex-1 text-muted-foreground">{d.name}</span>
                      <span className="font-semibold tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent leads + recent projects */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent leads */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <SectionHeader title="Recent leads" action={{ label: "All leads", to: "/crm" }} />
          </div>
          <div className="divide-y divide-border">
            {leadsQ.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))
            ) : recentLeads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Users className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No leads yet.</p>
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.company ?? lead.email ?? "—"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                      STAGE_COLORS[lead.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {lead.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent projects */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <SectionHeader
              title="Recent projects"
              action={{ label: "All projects", to: "/projects" }}
            />
          </div>
          <div className="divide-y divide-border">
            {projectsQ.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                    <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
                  </div>
                </div>
              ))
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <FolderKanban className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              </div>
            ) : (
              recentProjects.map((project) => {
                const StatusIcon = STATUS_ICON[project.status] ?? Circle;
                return (
                  <Link
                    key={project.id}
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <StatusIcon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        STATUS_COLOR[project.status] ?? "text-muted-foreground",
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-medium">{project.name}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-1.5 flex-1" />
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
