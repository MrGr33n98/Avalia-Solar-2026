'use client';

import React from 'react';

interface IcpSectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function IcpSectionHeader({ title, description, badge }: IcpSectionHeaderProps) {
  return (
    <div className="pb-3 border-b border-[#D8DEE8] mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2">
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-tight text-[#0B1F3A]">
          {title}
        </h3>
        {description && (
          <p className="text-[10.5px] font-medium text-[#526071]">
            {description}
          </p>
        )}
      </div>
      {badge && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest bg-[#EEF4FF] text-[#1F5EFF] border border-[#1F5EFF]/10">
          {badge}
        </span>
      )}
    </div>
  );
}
