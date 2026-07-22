'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IcpRadioCardProps {
  checked: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export function IcpRadioCard({
  checked,
  onClick,
  label,
  description,
  badge,
  disabled = false,
}: IcpRadioCardProps) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      className={cn(
        'relative flex items-start gap-3 p-4 border rounded-md cursor-pointer select-none transition-all outline-none min-h-[44px]',
        checked
          ? 'bg-[#EEF4FF] border-[#1F5EFF] text-[#0B1F3A]'
          : 'bg-white border-[#D8DEE8] text-[#0B1F3A] hover:bg-[#F8FAFC] hover:border-[#B8C2D1]',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      role="radio"
      aria-checked={checked}
    >
      <div className="flex items-center h-5 mt-0.5">
        <div
          className={cn(
            'h-4 w-4 rounded-full border flex items-center justify-center transition-all',
            checked ? 'border-[#1F5EFF] bg-white' : 'border-[#B8C2D1] bg-white'
          )}
        >
          {checked && <div className="h-2 w-2 rounded-full bg-[#1F5EFF]" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold leading-none tracking-tight uppercase">{label}</span>
          {badge && (
            <Badge className="bg-[#14804A] hover:bg-[#14804A] text-white border-none rounded-sm text-[8px] font-black uppercase px-2 py-0.5 tracking-wider h-auto leading-none">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p className={cn('text-[10px] mt-1.5 leading-normal font-medium', checked ? 'text-[#0B1F3A]/70' : 'text-[#526071]')}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
