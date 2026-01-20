'use client';

import { motion } from 'framer-motion';
import { 
  Building2, 
  Package, 
  Star, 
  Image as ImageIcon, 
  Target, 
  Megaphone,
  Settings,
  BarChart3,
  FileText,
  Sparkles,
  Home,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
}

const menuItems = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { id: 'style-analysis', label: 'Design System', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'benchmark', label: 'Benchmark', icon: Award },
  { id: 'info', label: 'Minha Empresa', icon: Building2 },
  { id: 'categories', label: 'Categorias', icon: FileText },
  { id: 'banners', label: 'Banners', icon: Sparkles },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'approvals', label: 'Aprovações', icon: FileText },
  { id: 'media', label: 'Mídia', icon: ImageIcon },
  { id: 'leads', label: 'Oportunidades', icon: Target },
  { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
];

const bottomMenuItems = [
  { id: 'settings', label: 'Configurações', icon: Settings }
];

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  pendingCount = 0 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  pendingCount?: number 
}) {
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo/Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-md flex items-center justify-center shadow-sm">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Gestão Enterprise</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start h-10 relative group transition-all',
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onTabChange(item.id)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1 bottom-1 w-1 bg-white rounded-r"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon className={cn(
                  'h-4 w-4 mr-3 transition-transform',
                  isActive && 'scale-110'
                )} />
                
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>

                {pendingCount > 0 && (item.id === 'leads' || item.id === 'reviews' || item.id === 'approvals') && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'destructive'} 
                    className={cn(
                      "ml-auto h-5 min-w-[20px] px-1.5 text-[10px]",
                      isActive && "bg-white/20 text-white border-transparent"
                    )}
                  >
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border/50 p-3">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start h-10',
                isActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-4 w-4 mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default function EnterpriseSidebar({ 
  activeTab, 
  onTabChange, 
  isOpen,
  onClose,
  pendingCount = 0
}: SidebarProps) {
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="left" 
          className="w-[280px] p-0 bg-card border-r border-border"
        >
          <SidebarContent 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            pendingCount={pendingCount} 
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] fixed inset-y-0 left-0 z-40 border-r border-border/50">
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          pendingCount={pendingCount} 
        />
      </aside>
    </>
  );
}
