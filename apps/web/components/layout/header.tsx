"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, Clock, LogOut, Menu, User as UserIcon } from "lucide-react";
import type { User } from "@/lib/types";

interface HeaderProps {
  user: User | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ user, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [time, setTime] = React.useState<Date | null>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex h-[57px] items-center justify-between border-b border-border bg-[#0c111a]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[#0c111a]/80">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-mono text-lg font-bold tracking-wider text-primary">
          TRADEX
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          // INSTITUTIONAL
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1.5 text-muted-foreground md:flex">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-price text-xs">
            {time ? time.toUTCString().replace(" GMT", " UTC") : "--:--:-- UTC"}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden text-sm text-foreground sm:inline">{user.username}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}
