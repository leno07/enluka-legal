"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { canViewAuditLog, ROLE_LABELS } from "@/lib/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Calendar,
  Bell,
  Settings,
  Shield,
  FileText,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Matters", href: "/matters", icon: Briefcase },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Notifications", href: "/notifications", icon: Bell, showBadge: true },
];

const adminItems = [
  { label: "Firm Settings", href: "/admin/firm", icon: Settings },
  { label: "Audit Log", href: "/admin/audit-log", icon: FileText, requireAudit: true },
  { label: "Escalation Policies", href: "/admin/escalation-policies", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { apiFetch } = useApi();

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
    <aside className="flex h-full w-64 flex-col bg-[oklch(0.20_0.05_240)] text-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">Enluka Legal</span>
          <p className="text-[10px] leading-none text-white/50">Practice Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 pt-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Main
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-l-3 border-white bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {user && (
          <>
            <div className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Administration
            </div>
            {adminItems
              .filter(
                (item) =>
                  !item.requireAudit ||
                  (user.role && canViewAuditLog(user.role))
              )
              .map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "border-l-3 border-white bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white/90"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </>
        )}
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-white/10 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-white/50">
                {user.role ? ROLE_LABELS[user.role] : ""} &middot; {user.firmName}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
