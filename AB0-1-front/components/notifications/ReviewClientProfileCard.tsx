'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Star,
  FileText,
  MessageSquare,
  Building2,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useNotificationStore } from '@/store/notificationStore';
import { AchievementsModal } from './AchievementsModal';
import { cn } from '@/lib/utils';

interface ReviewClientProfileCardProps {
  user?: {
    name: string;
    avatar_url?: string;
    city?: string;
    state?: string;
    created_at?: string;
    level?: number;
    points?: number;
    max_points?: number;
    verified?: boolean;
  };
}

export const ReviewClientProfileCard: React.FC<ReviewClientProfileCardProps> = ({ user }) => {
  const pathname = usePathname();
  const { unreadCount, unreadMessagesCount } = useNotificationStore();
  const [showAchievements, setShowAchievements] = useState(false);

  const name = user?.name || 'Felipe Morais';
  const avatarUrl = user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const location = user?.city && user?.state ? `${user.city}, ${user.state}` : 'Florianópolis, SC';
  const memberSince = 'Membro desde jan/2024';
  const level = user?.level || 2;
  const points = user?.points || 350;
  const maxPoints = user?.max_points || 500;
  const progressPercent = Math.min(100, Math.round((points / maxPoints) * 100));

  const menuItems = [
    { label: 'Dashboard', href: '/review-dashboard', icon: LayoutDashboard },
    { label: 'Minhas avaliações', href: '/review-dashboard/reviews', icon: Star },
    { label: 'Orçamentos', href: '/review-dashboard/quotes', icon: FileText, badge: 2 },
    { label: 'Mensagens', href: '/review-dashboard/messages', icon: MessageSquare, badge: unreadMessagesCount || 1 },
    { label: 'Empresas favoritas', href: '/review-dashboard/favorites', icon: Building2 },
    { label: 'Notificações', href: '/review-dashboard/notifications', icon: Bell, badge: unreadCount || 4 },
    { label: 'Perfil e configurações', href: '/review-dashboard/profile', icon: Settings },
  ];

  return (
    <aside className="w-full space-y-4 font-sans">
      {/* Upper Profile Box Swiss Style */}
      <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm rounded-full">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold uppercase">
                {name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <CheckCircle2 className="absolute bottom-0 right-0 h-5 w-5 fill-blue-600 text-white" />
          </div>

          <h2 className="mt-2 text-base font-bold text-slate-900 flex items-center justify-center gap-1.5">
            {name}
          </h2>
          <span className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 tracking-tight rounded-none">
            Review Cliente
          </span>

          <p className="mt-2 text-xs text-slate-500">{location}</p>
          <p className="text-[11px] text-slate-400">{memberSince}</p>
        </div>

        {/* Level & Points Bar */}
        <div
          onClick={() => setShowAchievements(true)}
          className="pt-3 border-t border-slate-100 cursor-pointer group hover:bg-slate-50 p-2 transition-colors border border-transparent hover:border-slate-200"
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-900">Nível {level}</span>
            <span className="text-slate-400 flex items-center gap-0.5 group-hover:text-blue-600">
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-slate-100 rounded-none [&>div]:bg-blue-600" />
          <p className="mt-1.5 text-[11px] font-medium text-slate-500 text-left">
            {points} de {maxPoints} pontos
          </p>
        </div>
      </div>

      {/* Navigation Menu Swiss Style */}
      <nav className="bg-white border border-slate-200 p-2 rounded-none shadow-sm divide-y divide-slate-100">
        <ul className="space-y-1 py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors rounded-none',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-slate-500')} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-bold rounded-none',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Support Help Card */}
      <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Precisa de ajuda?</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Fale com nosso time de atendimento.
            </p>
          </div>
        </div>
        <Link
          href="/support"
          className="inline-flex items-center justify-center w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors uppercase tracking-wider rounded-none"
        >
          Entrar em contato
        </Link>
      </div>

      {/* Modal Conquistas e Progresso */}
      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
    </aside>
  );
};
