"use client";

import { useAuth } from "@/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, User, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";

function useBreadcrumbs() {
  const pathname = usePathname();
  // Strip /dashboard for breadcrumb display, keep other paths as-is
  const cleanPath = pathname === "/dashboard" ? "" : pathname;
  const segments = cleanPath.split("/").filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const label = seg
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Skip UUIDs/CUIDs in breadcrumbs
    const isCuid = /^[a-z0-9]{20,}$/i.test(seg);
    if (isCuid) {
      crumbs.push({ label: "..." });
      continue;
    }

    const href = "/" + segments.slice(0, i + 1).join("/");
    crumbs.push({ label, href });
  }

  return crumbs;
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const { user, logout } = useAuth();
  const { apiFetch } = useApi();
  const crumbs = useBreadcrumbs();

  const { data: notifData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () => apiFetch("/api/notifications?limit=1&unread=true"),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = notifData?.unreadCount ?? 0;

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "??";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-3 md:px-6">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.length === 0 ? (
          <span className="font-medium text-foreground">Dashboard</span>
        ) : (
          crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))
        )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role ? ROLE_LABELS[user.role] : ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/firm" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
