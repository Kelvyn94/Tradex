import { Activity, BarChart3, Globe, Shield, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: TrendingUp, text: "Institutional Order Flow Tracking" },
  { icon: BarChart3, text: "SMT Divergence Detection" },
  { icon: Shield, text: "Bank-Level Security" },
  { icon: Globe, text: "Multi-Asset Correlation" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(222_40%_11%),_hsl(222_47%_5%))] p-4">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="hidden flex-col justify-center p-8 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <Activity className="h-10 w-10 text-primary" />
            <h1 className="font-mono text-3xl font-bold tracking-wider text-primary">
              TRADEX
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Institutional-grade
            <br />
            trade execution intelligence.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Smart money concepts, SMT divergence, and order-flow analysis in
            one terminal built for ICT practitioners.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card/60 p-3"
              >
                <feature.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
