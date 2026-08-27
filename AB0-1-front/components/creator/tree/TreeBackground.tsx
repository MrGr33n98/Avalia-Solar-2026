import React from 'react';
import { CreatorTreeAppearance, CreatorTreeTheme } from '@/types/creator-tree';
import { cn } from '@/lib/utils';

interface TreeBackgroundProps {
  themeKey?: CreatorTreeTheme | string;
  appearance?: CreatorTreeAppearance;
  children: React.ReactNode;
}

export function TreeBackground({ themeKey = 'solar', appearance, children }: TreeBackgroundProps) {
  const isCustom = appearance?.background?.type === 'color' || appearance?.background?.type === 'gradient';
  
  let bgClass = 'bg-slate-50'; 
  const style: React.CSSProperties = {};

  if (isCustom) {
    if (appearance?.background?.type === 'color') {
      style.backgroundColor = appearance.background.value;
    } else if (appearance?.background?.type === 'gradient') {
      style.backgroundImage = appearance.background.value;
    }
  } else {
    if (themeKey === 'dark') bgClass = 'bg-slate-950';
    if (themeKey === 'neo') bgClass = 'bg-indigo-950 text-indigo-50';
    if (themeKey === 'monochrome') bgClass = 'bg-white';
    if (themeKey === 'glass') bgClass = 'bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl';
  }

  return (
    <div 
      className={cn("min-h-screen w-full flex flex-col relative overflow-x-hidden", bgClass)}
      style={style}
    >
      {/* Optional overlay for video/image backgrounds */}
      {appearance?.background?.overlayOpacity && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{ 
            backgroundColor: `rgba(0,0,0,${(appearance.background.overlayOpacity / 100).toFixed(2)})` 
          }} 
        />
      )}
      
      <div className="relative z-10 flex flex-col items-center w-full min-h-screen pb-12">
        {children}
      </div>
    </div>
  );
}
