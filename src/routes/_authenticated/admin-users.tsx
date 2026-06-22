import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import {
  listUsers,
  setUserRole,
  createUserAccount,
  deleteUserAccount,
  type AppRole,
  type ManagedUser,
} from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Trash2, Search, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-users")({
  component: AdminUsersPage,
});

const ROLES: AppRole[] = ["CLIENT", "TEAM_MEMBER", "ADMIN", "SUPER_ADMIN"];

const roleColor: Record<AppRole, string> = {
  SUPER_ADMIN: "bg-primary/20 text-primary",
  ADMIN: "bg-primary/15 text-primary",
  TEAM_MEMBER: "bg-secondary text-secondary-foreground",
  CLIENT: "bg-muted text-muted-foreground",
};

function AdminUsersPage() {
  const { hasAnyRole, hasRole, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);
  const isSuper = hasRole("SUPER_ADMIN");

  useEffect(() => {
    if (!isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, navigate]);

  const list = useServerFn(listUsers);
  const setRole = useServerFn(setUserRole);
  const createAcct = useServerFn(createUserAccount);
  const delAcct = useServerFn(deleteUserAccount);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
    enabled: isAdmin,
  });

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => setRole({ data: v }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (userId: string) => delAcct({ data: { userId } }),
    onSuccess: () => {
      toast.success("Account deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const createMut = useMutation({
    mutationFn: (v: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role: AppRole;
    }) => createAcct({ data: v }),
    onSuccess: () => {
      toast.success("Account created");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const filtered = users.filter((u: ManagedUser) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q)
    );
  });

  function assignableRoles() {
    return isSuper ? ROLES : (["CLIENT", "TEAM_MEMBER"] as AppRole[]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage team members and client accounts.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> New account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create account</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMut.mutate({
                  name: String(fd.get("name")),
                  email: String(fd.get("email")),
                  phone: String(fd.get("phone")),
                  password: String(fd.get("password")),
                  role: String(fd.get("role")) as AppRole,
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Full name</Label>
                <Input id="c-name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">Phone</Label>
                <Input id="c-phone" name="phone" inputMode="tel" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-pw">Temporary password</Label>
                <Input id="c-pw" name="password" type="text" minLength={8} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-role">Role</Label>
                <select
                  id="c-role"
                  name="role"
                  defaultValue="CLIENT"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {assignableRoles().map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating…" : "Create account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u: ManagedUser) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name || "—"}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {u.email}
                    </span>
                    {u.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {u.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={roleColor[u.role]}>{u.role}</Badge>
                <Select
                  value={u.role}
                  onValueChange={(role) =>
                    roleMut.mutate({ userId: u.id, role: role as AppRole })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles().map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSuper && u.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete ${u.email}? This cannot be undone.`))
                        delMut.mutate(u.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
