import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  alert?: boolean;
}

export function StatsCard({ label, value, icon: Icon, trend, trendValue, alert }: StatsCardProps) {
  return (
    <div className={cn(
      "glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-white/10",
      alert && "border-destructive/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-2.5 rounded-xl",
          alert ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full border",
            trend === "up" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
          )}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </span>
        )}
      </div>
      
      <div className="space-y-1 relative z-10">
        <h3 className="text-2xl font-bold tracking-tight font-mono">{value}</h3>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>

      {/* Decorative gradient blob */}
      <div className={cn(
        "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-10",
        alert ? "bg-destructive" : "bg-primary"
      )} />
    </div>
  );
}
