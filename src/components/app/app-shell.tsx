import { type ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileGate } from "@/components/app/profile-gate";
import { CommandPalette, useCommandPalette } from "@/components/app/command-palette";
import { fetchUnreadCount } from "@/lib/messages";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  MessageSquare,
  Inbox,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Search,
  ChevronRight,
  GalleryHorizontalEnd,
  ListTodo,
  Wallet,
} from "lucide-react";

type Access = "staff" | "client" | "admin" | "all";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  access: Access;
  badge?: "unread";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, access: "staff" },
      { to: "/portal", label: "My Workspace", icon: Briefcase, access: "client" },
    ],
  },
  {
    title: "Work",
    items: [
      { to: "/crm", label: "CRM", icon: Users, access: "staff" },
      { to: "/projects", label: "Projects", icon: FolderKanban, access: "staff" },
    ],
  },
  {
    title: "Communication",
    items: [
      { to: "/inbox", label: "Client Inbox", icon: Inbox, access: "staff", badge: "unread" },
      {
        to: "/messages",
        label: "Messages",
        icon: MessageSquare,
        access: "client",
        badge: "unread",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/admin-users", label: "Account Management", icon: UserCog, access: "admin" },
      {
        to: "/admin-case-studies",
        label: "Case Studies",
        icon: GalleryHorizontalEnd,
        access: "admin",
      },
      { to: "/finance", label: "Finance", icon: Wallet, access: "admin" },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/notes", label: "Notes & Tasks", icon: ListTodo, access: "staff" },
      { to: "/settings", label: "Settings", icon: Settings, access: "all" },
    ],
  },
];

function roleLabel(roles: AppRole[]) {
  if (roles.includes("SUPER_ADMIN")) return "Super Admin";
  if (roles.includes("ADMIN")) return "Admin";
  if (roles.includes("TEAM_MEMBER")) return "Team Member";
  if (roles.includes("CLIENT")) return "Client";
  return "Member";
}

function roleBadgeClass(roles: AppRole[]) {
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN"))
    return "bg-primary/15 text-primary border-primary/20";
  if (roles.includes("TEAM_MEMBER")) return "bg-secondary text-secondary-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}

function initials(email: string | undefined) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

// Route to breadcrumb label map
const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/portal": "My Workspace",
  "/crm": "CRM",
  "/projects": "Projects",
  "/inbox": "Client Inbox",
  "/messages": "Messages",
  "/admin-users": "Account Management",
  "/admin-case-studies": "Case Studies",
  "/finance": "Finance",
  "/notes": "Notes & Tasks",
  "/settings": "Settings",
};

function getBreadcrumb(pathname: string): string {
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname === route || pathname.startsWith(route + "/")) return label;
  }
  return "Lahza";
}

const SIDEBAR_COLLAPSED_KEY = "lahza-sidebar-collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, isStaff, isClient, hasAnyRole, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const isAdmin = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: () => fetchUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 20000,
  });

  function canSee(access: Access) {
    if (access === "all") return true;
    if (access === "staff") return isStaff;
    if (access === "client") return isClient;
    if (access === "admin") return isAdmin;
    return false;
  }

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => canSee(i.access)) }))
    .filter((g) => g.items.length > 0);

  const breadcrumb = getBreadcrumb(pathname);

  // ---- Sidebar inner content (shared between desktop and mobile) ----
  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    return (
      <div className="flex h-full flex-col">
        {/* Logo + collapse toggle */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border",
            collapsed && !isMobile ? "justify-center px-0" : "justify-between px-4",
          )}
        >
          <Link
            to="/"
            className="flex items-center gap-2 min-w-0"
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <Logo
              size={28}
              showWordmark={!collapsed || isMobile}
              className={cn("transition-all", collapsed && !isMobile && "justify-center")}
            />
          </Link>
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
              />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          {visibleGroups.map((group) => (
            <div key={group.title} className="mb-5">
              {(!collapsed || isMobile) && (
                <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const showBadge = item.badge === "unread" && unread > 0;

                  const linkContent = (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => isMobile && setMobileOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg transition-all duration-150",
                        collapsed && !isMobile ? "h-9 w-9 justify-center mx-auto" : "h-9 px-3",
                        active
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      {/* Active indicator — left border pill */}
                      {active && (
                        <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary" />
                      )}

                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-primary" : "group-hover:text-foreground",
                        )}
                      />

                      {(!collapsed || isMobile) && (
                        <>
                          <span className="flex-1 truncate text-sm font-medium leading-none">
                            {item.label}
                          </span>
                          {showBadge && (
                            <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold tabular-nums text-primary-foreground">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </>
                      )}

                      {/* Collapsed badge dot */}
                      {collapsed && !isMobile && showBadge && (
                        <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  );

                  if (collapsed && !isMobile) {
                    return (
                      <TooltipProvider key={item.to} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user card */}
        <div className={cn("shrink-0 border-t border-sidebar-border px-2 py-3 space-y-1")}>
          {/* User */}
          {collapsed && !isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {initials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/60">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {initials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-none">{user?.email}</p>
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                        roleBadgeClass(roles),
                      )}
                    >
                      {roleLabel(roles)}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <ProfileGate />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative hidden shrink-0 border-e border-sidebar-border bg-sidebar md:block overflow-hidden"
        style={{ minWidth: 0 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 start-0 z-50 w-64 border-e border-sidebar-border bg-sidebar md:hidden"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden text-foreground font-medium md:block">{breadcrumb}</span>
          </div>

          <div className="flex-1" />

          {/* Command palette trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground md:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
            <span className="ms-2 flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
              <span>⌘</span>K
            </span>
          </button>

          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCmdOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notification bell */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </div>

          {/* User avatar (header) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-accent">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {initials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                      roleBadgeClass(roles),
                    )}
                  >
                    {roleLabel(roles)}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
