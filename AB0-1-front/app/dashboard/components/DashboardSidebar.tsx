'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingCount?: number;
}

const menuItems = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: BarChart3,
    description: 'Dashboard principal'
  },
  {
    id: 'info',
    label: 'Minha Empresa',
    icon: Building2,
    description: 'Informações gerais'
  },
  {
    id: 'categories',
    label: 'Categorias',
    icon: FileText,
    description: 'Gestão de categorias'
  },
  {
    id: 'banners',
    label: 'Banners',
    icon: Sparkles,
    description: 'Patrocínios e anúncios'
  },
  {
    id: 'products',
    label: 'Produtos',
    icon: Package,
    description: 'Catálogo de produtos'
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: Star,
    description: 'Avaliações recebidas'
  },
  {
    id: 'media',
    label: 'Mídia',
    icon: ImageIcon,
    description: 'Galeria de fotos'
  },
  {
    id: 'leads',
    label: 'Oportunidades',
    icon: Target,
    description: 'Leads e vendas'
  },
  {
    id: 'campaigns',
    label: 'Campanhas',
    icon: Megaphone,
    description: 'Marketing e análises'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Análise avançada de dados',
    badge: 'PRO'
  }
];

const bottomMenuItems = [
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Ajustes da conta'
  }
];

export default function DashboardSidebar({ 
  activeTab, 
  onTabChange, 
  collapsed = false,
  onToggleCollapse,
  pendingCount = 0
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? '80px' : '280px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40"
    >
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Dashboard</h2>
                <p className="text-xs text-muted-foreground">Gestão Empresarial</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {collapsed && (
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center mx-auto">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start relative group transition-all duration-200',
                  collapsed ? 'px-0 justify-center' : 'px-4',
                  isActive && 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
                  !isActive && 'hover:bg-muted'
                )}
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Active indicator */}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  collapsed ? '' : 'mr-3',
                  isActive && 'scale-110',
                  !isActive && 'group-hover:scale-110'
                )} />
                
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 text-left text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* PRO Badge for premium features */}
                {!collapsed && (item as any).badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-auto h-5 px-2 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                  >
                    {(item as any).badge}
                  </Badge>
                )}

                {/* Pending badge for reviews/leads */}
                {!collapsed && pendingCount > 0 && (item.id === 'leads' || item.id === 'reviews') && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </Button>

              {/* Tooltip for collapsed state */}
              <AnimatePresence>
                {collapsed && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="fixed left-20 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-xl border border-border z-50 whitespace-nowrap"
                    style={{ 
                      top: `${(index * 48) + 120}px`
                    }}
                  >
                    <div className="text-sm font-medium flex items-center gap-2">
                      {item.label}
                      {(item as any).badge && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          {(item as any).badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-2">
        <Separator className="mb-2" />
        
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                collapsed ? 'px-0 justify-center' : 'px-4',
                isActive && 'bg-primary text-primary-foreground',
                !isActive && 'hover:bg-muted'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn(
                'h-5 w-5',
                !collapsed && 'mr-3'
              )} />
              
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          );
        })}

        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full',
                collapsed ? 'justify-center px-0' : 'justify-start px-4'
              )}
              onClick={onToggleCollapse}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-3" />
                  <span className="text-xs text-muted-foreground">Recolher</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </motion.aside>
  );
}
