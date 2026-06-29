"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Shield, 
  FileText, 
  BarChart3, 
  Settings,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/dashboard" 
  },
  { 
    icon: Shield, 
    label: "Empresas", 
    href: "/dashboard/companies" 
  },
  { 
    icon: FileText, 
    label: "Propostas", 
    href: "/dashboard/proposals" 
  },
  { 
    icon: Users, 
    label: "Clientes", 
    href: "/dashboard/clients" 
  },
  { 
    icon: BarChart3, 
    label: "Relatórios", 
    href: "/dashboard/reports" 
  },
  { 
    icon: Settings, 
    label: "Configurações", 
    href: "/dashboard/settings" 
  },
];

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside 
      className={cn(
        "clay-panel h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        "border-r border-[hsl(var(--clay-shadow-light))]"
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          {!collapsed && <BrandLogo className="h-8" sizes="139px" priority />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  "text-sm font-medium",
                  isActive
                    ? "clay-btn-primary"
                    : "hover:bg-[hsl(var(--clay-surface-raised))]",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5", collapsed ? "" : "flex-shrink-0")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
