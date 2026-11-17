'use client';

import React from 'react';
import {
  Activity,
  Star,
  Box,
  Gift,
  Bookmark,
  MessageSquare,
  Award,
  Bell,
  User,
  Settings,
} from 'lucide-react';
import { UserTabId, UserProfileStats } from './types';

interface UserProfileSidebarNavProps {
  activeTab: UserTabId;
  onSelectTab: (tab: UserTabId) => void;
  stats?: UserProfileStats;
  className?: string;
}

interface NavItemConfig {
  id: UserTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

export function UserProfileSidebarNav({
  activeTab,
  onSelectTab,
  stats,
  className = '',
}: UserProfileSidebarNavProps) {
  const items: NavItemConfig[] = [
    {
      id: 'activity_center',
      label: 'Central de Atividades',
      icon: Activity,
    },
    {
      id: 'my_reviews',
      label: 'Minhas Avaliações',
      icon: Star,
      badge: stats?.reviews_count,
    },
    {
      id: 'products_used',
      label: 'Equipamentos que Utilizo',
      icon: Box,
      badge: stats?.equipments_count,
    },
    {
      id: 'my_rewards',
      label: 'Recompensas & Pontos',
      icon: Gift,
    },
    {
      id: 'my_lists',
      label: 'Meus Comparativos',
      icon: Bookmark,
      badge: stats?.saved_reviews_count,
    },
    {
      id: 'community_qa',
      label: 'Perguntas & Respostas',
      icon: MessageSquare,
    },
    {
      id: 'achievements',
      label: 'Conquistas & Selos',
      icon: Award,
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
    },
    {
      id: 'profile_details',
      label: 'Dados do Perfil',
      icon: User,
    },
    {
      id: 'privacy_settings',
      label: 'Privacidade & Conta',
      icon: Settings,
    },
  ];

  return (
    <nav
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-sm ${className}`}
      aria-label="Navegação do Perfil"
    >
      {/* Visualização Mobile: Horizontal Scroll */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-1.5 p-1 -mx-1 snap-x">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`shrink-0 snap-start flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visualização Desktop: Vertical List */}
      <div className="hidden lg:flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
              data-testid={`user-nav-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

