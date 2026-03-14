'use client';

import {
  BadgeCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  Home,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  Zap,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnterpriseSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    description: 'Dashboard principal',
    color: 'from-brand-blue to-brand-cyan'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Dados detalhados',
    color: 'from-brand-purple to-brand-pink'
  },
  {
    id: 'companies',
    label: 'Empresas',
    icon: Users,
    description: 'Gestão de clientes',
    color: 'from-emerald-400 to-brand-green'
  },
  {
    id: 'reviews',
    label: 'Avaliações',
    icon: MessageSquare,
    description: 'Feedback dos clientes',
    color: 'from-amber-400 to-brand-yellow'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Preferências do sistema',
    color: 'from-slate-400 to-slate-600'
  }
];

export default function EnterpriseSidebar({ activeTab, onTabChange }: EnterpriseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] clay-card border-r-2 border-white/10 transition-all duration-300",
        isCollapsed ? "w-20" : "w-80"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-8 h-8 w-8 rounded-full bg-brand-blue hover:bg-brand-blue/80 text-white shadow-lg flex items-center justify-center transition-all z-10"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="p-6 space-y-4">
        {/* Header */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center shadow-lg">
                  <Star className="h-5 w-5 text-white fill-white" />
                </div>
                <h2 className="text-xl font-black bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
                  AvaliaSolar
                </h2>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Plataforma de Avaliação
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                "w-full p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id
                  ? "bg-gradient-to-r " + item.color + " text-white shadow-xl shadow-black/20"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Animated Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity",
                item.color
              )} />

              <div className="flex items-center gap-4 relative z-10">
                <motion.div
                  animate={{ 
                    rotate: hoveredItem === item.id ? [0, -10, 10, 0] : 0,
                    scale: activeTab === item.id ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    activeTab === item.id ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </motion.div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 text-left"
                    >
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className={cn(
                        "text-xs transition-colors",
                        activeTab === item.id ? "text-white/80" : "text-muted-foreground/60"
                      )}>
                        {item.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active Indicator */}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="h-8 w-1 bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>

              {/* Hover Effect */}
              {hoveredItem === item.id && !isCollapsed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 border-2 border-white/20 rounded-2xl"
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Unique Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 border border-brand-purple/20"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center"
                >
                  <Zap className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-brand-purple dark:text-brand-pink">
                    Potencial Ilimitado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sua empresa no topo
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
