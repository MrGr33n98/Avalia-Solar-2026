'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  UserRound,
  ClipboardList,
  Laptop,
  Trophy,
  Award,
  Bell,
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
    <div className="flex flex-col gap-5 rounded-none border border-slate-200 bg-white p-5 shadow-none">
      {/* Informações Principais */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          {user.avatar_url ? (
            <Image
              src={getFullImageUrl(user.avatar_url)}
              alt={user.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xl font-semibold text-slate-800 shadow-sm">
              {initialsFromName(user.name)}
            </div>
          )}
          <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white shadow">
            <CheckCircle2 className="h-3.5 w-3.5 fill-white text-emerald-500" />
          </div>
        </div>

        <h3 className="text-base font-semibold leading-snug text-slate-950">{user.name}</h3>
        <p className="mt-1 text-xs font-medium text-slate-600">
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
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-none border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
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
        <div className="h-1.5 w-full overflow-hidden rounded-none bg-slate-100">
          <div
            className="h-full rounded-none bg-blue-600 transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <Link
          href="/review-dashboard/profile"
          className="mt-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
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
                'flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors rounded-none',
                isActive
                  ? 'border-blue-600 bg-slate-100 text-slate-950'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              )}
            >
              <Icon
                className={cn(
                  'h-4.5 w-4.5',
                  isActive ? 'text-blue-600' : 'text-slate-400'
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
