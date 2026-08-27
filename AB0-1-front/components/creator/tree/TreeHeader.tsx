import React from 'react';
import { PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { CreatorTreeAppearance, CreatorTreeTheme } from '@/types/creator-tree';

interface TreeHeaderProps {
  creator: PublicCreatorTreeResponse['creator'];
  themeKey?: string;
  appearance?: CreatorTreeAppearance;
}

export function TreeHeader({ creator, themeKey, appearance }: TreeHeaderProps) {
  const isDark = themeKey === 'dark' || themeKey === 'neo';
  const configuredColor = appearance?.fontColor || appearance?.textColor;
  const numericColor = configuredColor?.match(/^#[0-9a-f]{6}$/i) ? Number.parseInt(configuredColor.slice(1), 16) : null;
  const isDarkConfiguredColor = numericColor !== null && (((numericColor >> 16) * 299 + (((numericColor >> 8) & 255) * 587) + ((numericColor & 255) * 114)) < 145000);
  const readableColor = isDark && isDarkConfiguredColor ? '#ffffff' : configuredColor;
  const textColor = readableColor ? undefined : (isDark ? 'text-white' : 'text-slate-900');
  const bioColor = readableColor ? undefined : (isDark ? 'text-slate-300' : 'text-slate-600');

  return (
    <div className="flex flex-col items-center text-center mt-12 mb-8 px-4 w-full max-w-2xl mx-auto">
      <div className="relative mb-4">
        <UserAvatar
          src={creator.avatar_url}
          name={creator.name}
          size={96}
          className="h-24 w-24 ring-4 ring-white/10 shadow-xl"
        />
      </div>
      
      <h1 className={cn("text-2xl font-bold flex items-center gap-2", textColor)} style={{ color: readableColor }}>
        {creator.name}
        <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
      </h1>
      
      {creator.headline && (
        <p className={cn("mt-2 text-base font-medium", textColor)} style={{ color: readableColor }}>
          {creator.headline}
        </p>
      )}
      
      {creator.bio && (
        <p className={cn("mt-3 text-sm max-w-md mx-auto line-clamp-3", bioColor)} style={{ color: readableColor }}>
          {creator.bio}
        </p>
      )}
    </div>
  );
}
