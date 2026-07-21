'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyChatButtonProps {
  companyId: string | number;
  companyName?: string;
  className?: string;
  variant?: 'button' | 'compact' | 'hero' | 'pill';
  label?: string;
  showOnlineStatus?: boolean;
}

export function CompanyChatButton({
  companyId,
  companyName,
  className = '',
  variant = 'button',
  label = 'Chat',
  showOnlineStatus = true,
}: CompanyChatButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/chat?company_id=${companyId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={companyName ? `Iniciar chat de atendimento com ${companyName}` : 'Iniciar chat de atendimento'}
      className={cn(
        'group relative inline-flex items-center justify-center font-bold transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 overflow-hidden shrink-0 cursor-pointer',
        // Micro-efeito de diferenciação: gradiente azul-esmeralda suave com borda de destaque
        'bg-gradient-to-r from-blue-50/90 via-emerald-50/90 to-blue-50/90 border border-emerald-400/60 text-emerald-800 hover:border-emerald-500 hover:from-blue-100 hover:to-emerald-100 hover:text-emerald-900',
        variant === 'hero' && 'h-11 px-5 rounded-xl text-sm font-extrabold shadow-emerald-500/10 border-emerald-400',
        variant === 'button' && 'h-8 px-3 rounded-lg text-xs',
        variant === 'compact' && 'h-7 px-2.5 rounded-lg text-[10px]',
        variant === 'pill' && 'h-6 px-2 rounded-full text-[10px]',
        className
      )}
    >
      {/* Efeito luminoso de varredura ao passar o mouse */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Ponto de status online piscante (Micro efeito especial) */}
      {showOnlineStatus && (
        <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}

      {/* Ícone de Chat com micro-escala */}
      <MessageSquare className="h-3.5 w-3.5 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-200 shrink-0" />

      {/* Texto do Botão */}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export default CompanyChatButton;
