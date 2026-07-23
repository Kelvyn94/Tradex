import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger" | "warning";
}

const TONE_CLASSES: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  default: "text-primary",
  success: "text-success",
  danger: "text-destructive",
  warning: "text-warning",
};

export function StatsCard({ title, value, icon: Icon, tone = "default" }: StatsCardProps) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={cn("tabular-price mt-1 truncate text-xl font-bold", TONE_CLASSES[tone])}>
            {value}
          </p>
        </div>
        <div className={cn("shrink-0 rounded-md bg-current/10 p-2", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
