"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardLayout({ 
  children, 
  className 
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--clay-bg))]">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className={cn(
          "flex-1 p-6 lg:p-8 overflow-auto",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
