'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User as UserIcon,
  Home,
  UserRound,
  ClipboardList,
  Laptop,
  Trophy,
  Award,
  Bell,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { PublicUserBadges } from '@/components/badges/PublicUserBadges';

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ReviewerProfileCardProps {
  profileCompletion?: number;
  greenScore?: number;
  unlockedBadgeIds?: string[];
}

export function ReviewerProfileCard({
  profileCompletion = 75,
  greenScore = 520,
  unlockedBadgeIds = [],
}: ReviewerProfileCardProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const menuItems = [
    { label: 'Central de Atividade', href: '/review-dashboard', icon: Home },
    { label: 'Detalhes do Perfil', href: '/review-dashboard/profile', icon: UserRound },
    { label: 'Minhas Avaliações', href: '/review-dashboard#reviews', icon: ClipboardList },
    { label: 'Soluções que Uso', href: '/review-dashboard#solutions', icon: Laptop },
    { label: 'Conquistas', href: '/review-dashboard/achievements', icon: Trophy },
    { label: 'Recompensas', href: '/review-dashboard#rewards', icon: Award },
    { label: 'Notificações', href: '/review-dashboard#notifications', icon: Bell },
  ];

  const location = [user.city, user.state].filter(Boolean).join(', ') || 'Brasil';

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Informações Principais */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          {user.avatar_url ? (
            <img
              src={getFullImageUrl(user.avatar_url)}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xl border-2 border-white shadow-md">
              {initialsFromName(user.name)}
            </div>
          )}
          <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white shadow">
            <CheckCircle2 className="h-3.5 w-3.5 fill-white text-emerald-500" />
          </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 leading-snug">{user.name}</h3>
        <p className="text-xs font-semibold text-emerald-600 mt-1">
          Especialista Solar · Nível {greenScore >= 760 ? 'Ouro' : 'Prata'}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {location}
        </p>

        {unlockedBadgeIds.length > 0 && (
          <div className="mt-2.5 flex justify-center">
            <PublicUserBadges unlockedBadgeIds={unlockedBadgeIds} maxVisible={3} size="sm" />
          </div>
        )}

        {/* Botão LinkedIn */}
        <button
          type="button"
          className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          Verify on LinkedIn
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* Progresso de Completude do Perfil */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-medium text-gray-500">
          <span>Perfil Completo</span>
          <span>{profileCompletion}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <Link
          href="/review-dashboard/profile"
          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 mt-0.5"
        >
          Completar detalhes do perfil →
        </Link>
      </div>

      <hr className="border-gray-100" />

      {/* Menu de Navegação */}
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-4.5 w-4.5',
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
