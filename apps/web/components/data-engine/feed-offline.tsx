import { SatelliteDish } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeedOfflineProps {
  title: string;
  description?: string;
}

/**
 * Shared institutional-grade empty/error state for anything backed by the
 * external Data Engine service. Per directive: the upstream service itself
 * is out of scope right now — this exists so its unavailability reads as
 * an intentional, designed state rather than a broken page.
 */
export function FeedOffline({ title, description }: FeedOfflineProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <SatelliteDish className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground/70">
          {description ?? "This feed is currently offline. Data will resume automatically once the connection is restored."}
        </p>
      </CardContent>
    </Card>
  );
}
