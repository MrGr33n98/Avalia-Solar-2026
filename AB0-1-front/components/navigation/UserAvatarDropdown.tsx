'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  Trophy,
  Award,
  Bell,
  UserRound,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFullImageUrl } from '@/utils/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMonthYear(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
}

export function UserAvatarDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isReviewer = user.role === 'review';
  const dashboardLink = isReviewer ? '/review-dashboard' : '/dashboard';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1.5 rounded-xl border border-brand-border bg-white p-1 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          {user.avatar_url ? (
            <img
              src={getFullImageUrl(user.avatar_url)}
              alt={user.name || 'Avatar'}
              className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs dark:bg-emerald-950 dark:text-emerald-400">
              {initialsFromName(user.name)}
            </div>
          )}
          <span className="hidden max-w-[100px] truncate text-xs font-semibold text-slate-700 dark:text-white/80 sm:block">
            {user.name.split(' ')[0]}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 rounded-2xl border-slate-200/80 p-0 shadow-2xl overflow-hidden bg-white z-[2000]">
        {/* Card de Perfil */}
        <div className="flex flex-col items-center p-6 text-center bg-slate-50/50">
          <div className="relative mb-3">
            {user.avatar_url ? (
              <img
                src={getFullImageUrl(user.avatar_url)}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg border-2 border-white shadow-md">
                {initialsFromName(user.name)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white shadow">
              <CheckCircle2 className="h-3 w-3 fill-white text-emerald-500" />
            </div>
          </div>

          <h4 className="text-base font-bold text-slate-900 line-clamp-1">{user.name}</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Membro desde {formatMonthYear(user.created_at)}
          </p>

          {isReviewer && (
            <button
              type="button"
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              Verificar com o LinkedIn
            </button>
          )}
        </div>

        <Separator />

        {/* Links do Menu */}
        <div className="p-2 space-y-0.5">
          <Link
            href={dashboardLink}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <LayoutDashboard className="h-4.5 w-4.5 text-slate-400" />
            {isReviewer ? 'Central do Avaliador' : 'Painel de Controle'}
          </Link>

          {isReviewer && (
            <>
              <Link
                href="/review-dashboard#reviews"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ClipboardList className="h-4.5 w-4.5 text-slate-400" />
                Minhas Avaliações
              </Link>

              <Link
                href="/review-dashboard/achievements"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Trophy className="h-4.5 w-4.5 text-slate-400" />
                Minhas Conquistas
              </Link>

              <Link
                href="/review-dashboard#green-house"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Award className="h-4.5 w-4.5 text-slate-400" />
                Meu Green House
              </Link>

              <Link
                href="/review-dashboard#notifications"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Bell className="h-4.5 w-4.5 text-slate-400" />
                Notificações
              </Link>
            </>
          )}

          <Link
            href={isReviewer ? '/review-dashboard/profile' : '/profile'}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserRound className="h-4.5 w-4.5 text-slate-400" />
            Configurações e Perfil
          </Link>
        </div>

        <Separator />

        {/* Sair */}
        <div className="p-2 bg-slate-50/50">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 text-red-500" />
            Sair da Conta
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
