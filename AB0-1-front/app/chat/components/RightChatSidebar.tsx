'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  Zap,
  MapPin,
  Building2,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  Lock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { type Conversation, type DirectMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

interface RightChatSidebarProps {
  activeConversation: Conversation | null;
  messages: DirectMessage[];
  isUser: boolean;
  onOpenBudgetWizard?: () => void;
  className?: string;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RightChatSidebar({
  activeConversation,
  messages,
  isUser,
  onOpenBudgetWizard,
  className,
}: RightChatSidebarProps) {
  if (!activeConversation) {
    return (
      <aside
        className={cn(
          'hidden lg:flex w-[320px] shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-4 overflow-y-auto',
          className
        )}
      >
        {/* Placeholder quando nenhuma conversa está selecionada */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center bg-white dark:bg-slate-900 shadow-xs">
          <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Painel de Negociação</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
            Selecione uma conversa para visualizar os dados de reputação, selos de verificação e arquivos.
          </p>
        </div>

        {/* Smart Banner Genérico */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-200 mb-1">
            <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>Garantia Avalia Solar</span>
          </div>
          <h4 className="text-sm font-bold leading-tight">Compare orçamentos solares com segurança</h4>
          <p className="mt-1 text-xs text-blue-100/90 leading-relaxed">
            Consumidores que comparam 3 propostas economizam em média até 18% no projeto final.
          </p>
          <Link href="/companies">
            <Button
              size="sm"
              className="mt-3 w-full rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-xs"
            >
              Explorar Instaladores Credenciados
            </Button>
          </Link>
        </div>

        {/* Rodapé Estilo LinkedIn */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
            <Link href="/como-funciona" className="hover:underline">Sobre</Link>
            <Link href="/central-ajuda" className="hover:underline">Central de Ajuda</Link>
            <Link href="/termos" className="hover:underline">Termos & Privacidade</Link>
          </div>
          <p className="text-center text-[10px]">Avalia Solar Corporation © 2026</p>
        </div>
      </aside>
    );
  }

  const title = (isUser ? activeConversation.company_name : activeConversation.user_name) || 'Contato';
  const avatarUrl = isUser
    ? activeConversation.company_logo_url || activeConversation.company_logo || activeConversation.company_avatar
    : activeConversation.user_avatar_url || activeConversation.user_avatar;

  // Filtrar anexos trocados no chat
  const sharedAttachments = messages.flatMap((m) => m.attachments || []);

  return (
    <aside
      className={cn(
        'hidden lg:flex w-[320px] shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 overflow-y-auto',
        className
      )}
    >
      {/* 1. Card de Reputação & Confiança (Perfil) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-md mb-2">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={title} className="object-cover" /> : null}
            <AvatarFallback className="bg-blue-600 text-white font-bold text-lg">
              {getInitials(title)}
            </AvatarFallback>
          </Avatar>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {title}
          </h3>

          {isUser ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Empresa Verificada 2026</span>
            </div>
          ) : (
            <span className="mt-1 text-xs text-slate-500 font-medium">Consumidor Verificado</span>
          )}
        </div>

        {isUser && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs">
                <Star className="h-3.5 w-3.5 fill-amber-500" />
                <span>4.9 / 5.0</span>
              </div>
              <span className="text-[10px] text-slate-400">48 Avaliações</span>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <Zap className="h-3.5 w-3.5" />
                <span>&lt; 45 min</span>
              </div>
              <span className="text-[10px] text-slate-400">Resposta SLA</span>
            </div>
          </div>
        )}

        {isUser && activeConversation.company_id && (
          <Link href={`/companies/${activeConversation.company_id}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5"
            >
              <span>Ver Perfil Completo</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* 2. Smart Banner Monetizável / Conversão estilo LinkedIn */}
      {isUser ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 text-white shadow-lg border border-blue-900/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Garantia de Melhor Orçamento</span>
          </div>
          <h4 className="text-xs font-bold leading-snug">Quer comparar esta proposta com outras empresas da sua cidade?</h4>
          <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
            Receba orçamentos de até 3 instaladores verificados com nota máxima no Avalia Solar.
          </p>
          <Button
            onClick={onOpenBudgetWizard}
            size="sm"
            className="mt-3 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md gap-1"
          >
            <span>Solicitar Orçamento Comparativo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-4 text-white shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-100 mb-1">
            <Sparkles className="h-4 w-4 text-white fill-white" />
            <span>Selo Ouro Pro</span>
          </div>
          <h4 className="text-xs font-bold leading-snug">Empresas com Selo Verificado recebem 4x mais leads!</h4>
          <p className="mt-1 text-[11px] text-amber-100 leading-relaxed">
            Destaque seu perfil no topo das buscas regionais e ganhe prioridade no chat.
          </p>
          <Button
            size="sm"
            className="mt-3 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md"
          >
            Ativar Selo Pro
          </Button>
        </div>
      )}

      {/* 3. Painel de Mídias e PDFs Compartilhados */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-950/40">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-2">
          <span>Documentos e Anexos</span>
          <span className="text-[10px] font-semibold text-slate-400">({sharedAttachments.length})</span>
        </h4>

        {sharedAttachments.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-2 text-center">Nenhum documento compartilhado nesta conversa ainda.</p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {sharedAttachments.map((att: any, index: number) => (
              <a
                key={index}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors"
              >
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="truncate flex-1 text-[11px]">{att.filename || 'Documento Orçamento.pdf'}</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Rodapé Estilo LinkedIn */}
      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[11px]">
          <Link href="/como-funciona" className="hover:underline">Sobre</Link>
          <Link href="/central-ajuda" className="hover:underline">Central de Ajuda</Link>
          <Link href="/termos" className="hover:underline">Termos & Privacidade</Link>
        </div>
        <p className="text-center text-[10px] text-slate-400">Avalia Solar Corporation © 2026</p>
      </div>
    </aside>
  );
}
