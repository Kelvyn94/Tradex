"use client";

import * as React from "react";
import { RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  /** Shown in the fallback tile, e.g. "SMT Matrix", "Market Sentiment". */
  label: string;
  className?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

/**
 * A real React error boundary (class component — hooks cannot implement
 * getDerivedStateFromError/componentDidCatch) scoped to a single widget
 * tile. Next.js route-level error.tsx only isolates failures per route
 * segment; a page like the Dashboard renders several independent data
 * sources side by side, and one feed failing must not take the other
 * tiles down with it. Wrap each independent widget in this.
 */
export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[widget-error] ${this.props.label}:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-card/40 p-6 text-center",
            this.props.className,
          )}
        >
          <RadioTower className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {this.props.label} — Feed Down
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            This widget failed to render. The rest of the dashboard is unaffected.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
