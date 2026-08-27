import React from 'react';
import { CreatorTreeAppearance } from '@/types/creator-tree';
import { cn } from '@/lib/utils';

interface TreeFooterProps {
  themeKey?: string;
  appearance?: CreatorTreeAppearance;
}

export function TreeFooter({ themeKey, appearance }: TreeFooterProps) {
  const isDark = themeKey === 'dark' || themeKey === 'neo';
  const textColor = appearance?.textColor ? appearance.textColor : (isDark ? 'text-slate-400' : 'text-slate-500');

  return (
    <div className={cn("mt-12 mb-6 text-center text-xs font-semibold opacity-60", textColor)}>
      Powered by Avalia Solar
    </div>
  );
}
