import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  fetchFinanceEntries,
  createFinanceEntry,
  deleteFinanceEntry,
  summarize,
  monthlySeries,
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  type FinanceType,
  type FinanceEntry,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finance")({
  component: FinancePage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
      <span
        className={
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl " +
          (tone === "positive"
            ? "bg-emerald-500/15 text-emerald-400"
            : tone === "negative"
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary")
        }
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function FinancePage() {
  const { hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);

  useEffect(() => {
    if (!isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, navigate]);

  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState<FinanceType>("REVENUE");
  const [filter, setFilter] = useState<"ALL" | FinanceType>("ALL");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["finance-entries"],
    queryFn: fetchFinanceEntries,
    enabled: isAdmin,
  });

  const createMut = useMutation({
    mutationFn: createFinanceEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-entries"] });
      toast.success("Entry added");
      setOpen(false);
    },
    onError: () => toast.error("Couldn't save entry"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFinanceEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-entries"] }),
  });

  const { totalRevenue, totalExpenses, netProfit } = useMemo(() => summarize(entries), [entries]);
  const chartData = useMemo(() => monthlySeries(entries), [entries]);

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.type === filter);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({
      type: entryType,
      amount: Number(fd.get("amount") || 0),
      category: String(fd.get("category")),
      description: String(fd.get("description") || "") || null,
      entry_date: String(fd.get("entry_date")) || new Date().toISOString().slice(0, 10),
    });
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Track revenue and expenses across the agency.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <Tabs value={entryType} onValueChange={(v) => setEntryType(v as FinanceType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="REVENUE">Revenue</TabsTrigger>
                  <TabsTrigger value="EXPENSE">Expense</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount ($)</Label>
                  <Input name="amount" type="number" min="0" step="0.01" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    name="entry_date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  name="category"
                  defaultValue={
                    (entryType === "REVENUE" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES)[0]
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(entryType === "REVENUE" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea name="description" rows={2} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending}>
                  Add {entryType === "REVENUE" ? "revenue" : "expense"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          tone="positive"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          tone="negative"
        />
        <StatCard
          icon={Wallet}
          label="Net Profit"
          value={`${netProfit < 0 ? "-" : ""}$${Math.abs(netProfit).toLocaleString()}`}
          tone={netProfit >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Revenue vs. expenses by month</h2>
        <div className="mt-4">
          {chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No entries yet — add your first one above.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.02 280)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.02 280)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.02 280)",
                    border: "1px solid oklch(0.27 0.02 280)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="oklch(0.9 0.21 122)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="expenses" name="Expenses" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold">All entries</h2>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="REVENUE">Revenue</TabsTrigger>
              <TabsTrigger value="EXPENSE">Expenses</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <Receipt className="h-7 w-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No entries to show.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((e) => (
              <FinanceRow key={e.id} entry={e} onDelete={() => deleteMut.mutate(e.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceRow({ entry, onDelete }: { entry: FinanceEntry; onDelete: () => void }) {
  return (
    <div className="group flex items-center gap-3 px-5 py-3">
      <Badge variant={entry.type === "REVENUE" ? "secondary" : "outline"} className="shrink-0">
        {entry.type === "REVENUE" ? "Revenue" : "Expense"}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.category}</p>
        {entry.description && (
          <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{entry.entry_date}</span>
      <span
        className={
          "shrink-0 text-sm font-semibold tabular-nums " +
          (entry.type === "REVENUE" ? "text-emerald-400" : "text-destructive")
        }
      >
        {entry.type === "REVENUE" ? "+" : "-"}${Number(entry.amount).toLocaleString()}
      </span>
      <button
        onClick={onDelete}
        className="shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
