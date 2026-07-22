'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface IcpCheckboxCardProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export function IcpCheckboxCard({
  checked,
  onCheckedChange,
  label,
  description,
  icon: Icon,
  disabled = false,
}: IcpCheckboxCardProps) {
  return (
    <label
      className={cn(
        'relative flex items-start gap-3 p-3.5 border rounded-md cursor-pointer select-none transition-all outline-none min-h-[44px]',
        'focus-within:ring-2 focus-within:ring-[#1F5EFF]/20 focus-within:border-[#1F5EFF]',
        checked
          ? 'bg-[#EEF4FF] border-[#1F5EFF] text-[#0B1F3A]'
          : 'bg-white border-[#D8DEE8] text-[#0B1F3A] hover:bg-[#F8FAFC] hover:border-[#B8C2D1]',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      <div className="flex items-center h-5 mt-0.5">
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => !disabled && onCheckedChange(!!val)}
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded-sm border-[#B8C2D1] data-[state=checked]:bg-[#1F5EFF] data-[state=checked]:border-[#1F5EFF]',
            'focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#1F5EFF]'
          )}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={cn('h-4 w-4 shrink-0', checked ? 'text-[#1F5EFF]' : 'text-[#526071]')} />}
          <span className="text-xs font-bold leading-none tracking-tight uppercase block">{label}</span>
        </div>
        {description && (
          <p className={cn('text-[10px] mt-1 leading-normal font-medium', checked ? 'text-[#0B1F3A]/70' : 'text-[#526071]')}>
            {description}
          </p>
        )}
      </div>
    </label>
  );
}
