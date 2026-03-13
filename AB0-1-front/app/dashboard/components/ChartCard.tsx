"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export default function ChartCard({
  title,
  description,
  children,
  className,
  actions,
}: ChartCardProps) {
  return (
    <div className={cn("clay-card p-6 space-y-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      <div className="w-full h-[300px]">
        {children}
      </div>
    </div>
  );
}
