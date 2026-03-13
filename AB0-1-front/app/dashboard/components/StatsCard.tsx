"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "purple" | "cyan" | "yellow";
  className?: string;
}

const iconColorClasses = {
  blue: "text-primary bg-primary/10",
  green: "text-accent bg-accent/10",
  purple: "text-secondary bg-secondary/10",
  cyan: "text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2))]/10",
  yellow: "text-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4))]/10",
};

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "blue",
  className,
}: StatsCardProps) {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;

  return (
    <div className={cn("clay-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn(
          "p-2 rounded-xl",
          iconColorClasses[iconColor]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        
        {change && (
          <p className={cn(
            "text-xs font-medium flex items-center gap-1",
            isPositive && "text-accent",
            isNegative && "text-destructive"
          )}>
            <span>
              {isPositive ? "+" : ""}{change.value}%
            </span>
            <span className="text-muted-foreground">{change.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
