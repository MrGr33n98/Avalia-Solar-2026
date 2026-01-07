'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface BannerPlaceholderProps {
  message?: string;
  className?: string;
}

/**
 * Componente de fallback para quando não há banners disponíveis
 * Exibe uma mensagem amigável ao invés de espaço vazio
 */
export function BannerPlaceholder({ 
  message = "Espaço disponível para anúncios", 
  className = "" 
}: BannerPlaceholderProps) {
  return (
    <div 
      className={`
        relative w-full overflow-hidden rounded-2xl 
        bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50
        border-2 border-dashed border-gray-300
        flex items-center justify-center
        aspect-[16/9] md:aspect-[3/1]
        ${className}
      `}
    >
      <div className="flex flex-col items-center gap-2 text-gray-500">
        <Info className="h-8 w-8 opacity-30" />
        <p className="text-sm font-medium opacity-50">{message}</p>
      </div>
    </div>
  );
}

export default BannerPlaceholder;
