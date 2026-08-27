import React from 'react';
import { PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { Globe, Instagram, Linkedin, Youtube, LucideIcon } from 'lucide-react';
import { normalizeSocialUrl, SocialUrlKind } from '@/lib/socialUrl';
import { CreatorShareButton } from '@/components/creator/CreatorShareButton';
import { CreatorTreeAppearance, CreatorTreeTheme } from '@/types/creator-tree';
import { cn } from '@/lib/utils';

interface TreeSocialBarProps {
  creator: PublicCreatorTreeResponse['creator'];
  themeKey?: string;
  appearance?: CreatorTreeAppearance;
}

const socialLinks: ReadonlyArray<readonly [
  'linkedin_url' | 'instagram_url' | 'youtube_url' | 'website_url',
  string,
  SocialUrlKind,
  LucideIcon,
]> = [
  ['linkedin_url', 'LinkedIn', 'linkedin', Linkedin],
  ['instagram_url', 'Instagram', 'instagram', Instagram],
  ['youtube_url', 'YouTube', 'youtube', Youtube],
  ['website_url', 'Site', 'website', Globe],
];

export function TreeSocialBar({ creator, themeKey, appearance }: TreeSocialBarProps) {
  const isDark = themeKey === 'dark' || themeKey === 'neo';
  const iconColorClass = appearance?.textColor || (isDark ? 'text-white' : 'text-slate-700');
  const bgClass = isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200/50 hover:bg-slate-300/50';

  return (
    <div className="flex flex-col items-center mt-2 mb-8">
      <div className="flex justify-center gap-3">
        {socialLinks.map(([key, label, kind, Icon]) => {
          if (!creator[key]) return null;
          return (
            <a 
              key={key} 
              href={normalizeSocialUrl(String(creator[key]), kind)} 
              target="_blank" 
              rel="noreferrer" 
              aria-label={label} 
              className={cn("grid h-11 w-11 place-items-center rounded-full transition-colors", bgClass, iconColorClass)}
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}
      </div>
      
      <div className="mt-6 flex justify-center">
        <CreatorShareButton 
          creatorSlug={creator.slug} 
          title={`${creator.name} | Avalia Solar`} 
          context={{ placement: 'tree', format: 'link' }} 
        />
      </div>
    </div>
  );
}
