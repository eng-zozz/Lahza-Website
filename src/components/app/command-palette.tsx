import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  Inbox,
  MessageSquare,
  Settings,
  UserCog,
  Plus,
  Search,
  LogOut,
  GalleryHorizontalEnd,
  ListTodo,
  Wallet,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { isStaff, isClient, hasAnyRole, signOut } = useAuth();
  const isAdmin = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);

  const go = useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate({ to } as unknown as Parameters<typeof navigate>[0]);
    },
    [navigate, onOpenChange],
  );

  const staffNav = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/dashboard",
      shortcut: "D",
    },
    { label: "CRM — Leads", icon: Users, to: "/crm", shortcut: "C" },
    {
      label: "Projects",
      icon: FolderKanban,
      to: "/projects",
      shortcut: "P",
    },
    {
      label: "Client Inbox",
      icon: Inbox,
      to: "/inbox",
      shortcut: "I",
    },
    {
      label: "Notes & Tasks",
      icon: ListTodo,
      to: "/notes",
      shortcut: "N",
    },
  ];

  const clientNav = [
    {
      label: "My Workspace",
      icon: Briefcase,
      to: "/portal",
      shortcut: "W",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      to: "/messages",
      shortcut: "M",
    },
  ];

  const adminNav = isAdmin
    ? [
        {
          label: "Account Management",
          icon: UserCog,
          to: "/admin-users",
        },
        {
          label: "Case Studies",
          icon: GalleryHorizontalEnd,
          to: "/admin-case-studies",
        },
        {
          label: "Finance",
          icon: Wallet,
          to: "/finance",
        },
      ]
    : [];

  const accountNav = [{ label: "Settings", icon: Settings, to: "/settings" }];

  const navItems = [
    ...(isStaff ? staffNav : []),
    ...(isClient && !isStaff ? clientNav : []),
    ...adminNav,
    ...accountNav,
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {navItems.length > 0 && (
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem
                key={item.to}
                value={item.label}
                onSelect={() => go(item.to)}
                className="gap-3"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
                {"shortcut" in item && (item as { shortcut?: string }).shortcut && (
                  <CommandShortcut>G {(item as { shortcut?: string }).shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isStaff && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem
                value="new lead create"
                onSelect={() => {
                  onOpenChange(false);
                  navigate({ to: "/crm" });
                }}
                className="gap-3"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>New Lead</span>
              </CommandItem>
              <CommandItem
                value="new project create"
                onSelect={() => {
                  onOpenChange(false);
                  navigate({ to: "/projects" });
                }}
                className="gap-3"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>New Project</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem
            value="sign out logout"
            onSelect={async () => {
              onOpenChange(false);
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="gap-3 text-destructive data-[selected=true]:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Hook: opens palette on Ctrl+K / Cmd+K */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
