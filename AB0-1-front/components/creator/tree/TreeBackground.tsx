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

  if (isCustom || appearance?.background?.type === 'image') {
    if (appearance?.background?.type === 'color') {
      style.backgroundColor = appearance.background.value;
    } else if (appearance?.background?.type === 'gradient') {
      style.backgroundImage = appearance.background.value;
    } else if (appearance?.background?.type === 'image') {
      style.backgroundImage = `url(${appearance.background.value})`;
      style.backgroundSize = appearance.background.fit || 'cover';
      style.backgroundPosition = appearance.background.position || 'center';
      style.backgroundRepeat = 'no-repeat';
    }
  } else {
    if (themeKey === 'dark') bgClass = 'bg-slate-950';
    if (themeKey === 'neo') bgClass = 'bg-indigo-950 text-indigo-50';
    if (themeKey === 'monochrome') bgClass = 'bg-white';
    if (themeKey === 'glass') bgClass = 'bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl';
  }

  const fontFamilyClass = 
    appearance?.fontFamily === 'serif' ? 'font-serif' :
    appearance?.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    
  const fontScaleClass = 
    appearance?.fontScale === 'sm' ? 'text-sm' :
    appearance?.fontScale === 'lg' ? 'text-lg' : 'text-base';
    
  if (appearance?.fontColor) {
    style.color = appearance.fontColor;
  }

  return (
    <div 
      className={cn("min-h-screen w-full flex flex-col relative overflow-x-hidden", bgClass, fontFamilyClass, fontScaleClass)}
      style={style}
    >
      {/* Optional overlay for video/image backgrounds */}
      {appearance?.background?.overlayOpacity && appearance.background.overlayOpacity > 0 && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{ 
            backgroundColor: appearance.background.overlayColor || '#000000',
            opacity: appearance.background.overlayOpacity / 100,
            backdropFilter: appearance.background.blur ? `blur(${appearance.background.blur}px)` : undefined,
          }} 
        />
      )}
      
      <div className="relative z-10 flex flex-col items-center w-full min-h-screen pb-12">
        {children}
      </div>
    </div>
  );
}
