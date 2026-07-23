"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Bot,
  Database,
  Brain,
  Network,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Trades", icon: TrendingUp, href: "/trades" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "AI Assistant", icon: Bot, href: "/ai-assistant" },
  { name: "Data Engine", icon: Database, href: "/data-engine" },
  { name: "ICT Analysis", icon: Brain, href: "/ict" },
  { name: "Correlation", icon: Network, href: "/correlation" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[57px] z-40 h-[calc(100vh-57px)] w-[220px] border-r border-border bg-[#0c111a] transition-transform duration-200 ease-in-out",
        "lg:sticky lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-full flex-col px-2 py-4">
        <div className="mb-4 flex items-center justify-between px-2 lg:hidden">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Navigation
          </span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="tracking-tight">{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-3 px-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            TRADEX
          </p>
          <p className="text-xs text-muted-foreground">v2.0.0 — institutional</p>
        </div>
      </div>
    </aside>
  );
}
