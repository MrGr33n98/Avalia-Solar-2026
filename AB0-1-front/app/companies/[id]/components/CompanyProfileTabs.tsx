"use client";

import { useMemo } from "react";
import {
  LayoutDashboard,
  Package,
  MessageCircle,
  ImageIcon,
  BarChart3,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface CompanyProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showFinancing: boolean;
  showGallery: boolean;
  showFaq: boolean;
}

export default function CompanyProfileTabs({
  activeTab,
  onTabChange,
  showFinancing,
  showGallery,
  showFaq,
}: CompanyProfileTabsProps) {
  const tabs = useMemo(() => {
    const list: TabItem[] = [
      { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
      { id: "products", label: "Produtos e Serviços", icon: Package },
      { id: "reviews", label: "Avaliações", icon: MessageCircle },
      { id: "projects", label: "Projetos", icon: ImageIcon },
      { id: "stats", label: "Estatísticas", icon: BarChart3 },
      { id: "contact", label: "Contato", icon: HelpCircle },
    ];
    return list;
  }, []);

  return (
    <div id="company-profile-tabs" className="w-full border-b border-slate-200 bg-transparent mt-5">
      <ScrollArea className="w-full">
        <TabsList className="h-auto min-w-full justify-start gap-6 rounded-none bg-transparent p-0 text-slate-500">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "h-auto rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-sm font-medium shadow-none transition-all duration-200",
                "text-slate-500 hover:bg-transparent hover:text-slate-900",
                "data-[state=active]:border-blue-700 data-[state=active]:bg-transparent data-[state=active]:text-slate-950 data-[state=active]:shadow-none data-[state=active]:font-bold"
              )}
            >
              <tab.icon className="mr-2 h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="opacity-0 hover:opacity-100 transition-opacity" />
      </ScrollArea>
    </div>
  );
}
