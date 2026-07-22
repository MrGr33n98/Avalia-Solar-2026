'use client';

import React from 'react';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IcpSectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function IcpSectionHeader({ 
  title, 
  description, 
  badge,
  isCollapsed = false,
  onToggle
}: IcpSectionHeaderProps) {
  const isClickable = typeof onToggle === 'function';

  return (
    <div 
      onClick={onToggle}
      className={cn(
        "pb-2.5 border-b border-[#D8DEE8] flex justify-between items-start gap-4 select-none",
        isClickable ? "cursor-pointer hover:bg-slate-50/50 -m-2 p-2 rounded-sm transition-colors" : "",
        isCollapsed ? "border-b-transparent pb-0" : "mb-4.5"
      )}
    >
      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[12.5px] font-black uppercase tracking-tight text-[#0B1F3A]">
            {title}
          </h3>
          {badge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest bg-[#EEF4FF] text-[#1F5EFF] border border-[#1F5EFF]/10">
              {badge}
            </span>
          )}
        </div>
        {description && !isCollapsed && (
          <p className="text-[10px] font-medium text-[#526071] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      {isClickable && (
        <button
          type="button"
          aria-label={isCollapsed ? "Expandir seção" : "Recolher seção"}
          className="text-[#7A8797] hover:text-[#0B1F3A] transition-colors p-1"
        >
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200", 
              isCollapsed ? "-rotate-90" : ""
            )} 
          />
        </button>
      )}
    </div>
  );
}
