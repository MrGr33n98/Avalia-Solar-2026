import React from 'react';
import { PublicCreatorTreeBlock } from '@/lib/api/creatorTree';
import { CreatorTreeAppearance } from '@/types/creator-tree';
import { cn } from '@/lib/utils';
import { ExternalLink, Download, FileText, ChevronRight, Share2 } from 'lucide-react';
import { CreatorTreeLink } from './CreatorTreeLink';

interface TreeBlockRendererProps {
  block: PublicCreatorTreeBlock;
  slug: string;
  themeKey?: string;
  appearance?: CreatorTreeAppearance;
}

export function TreeBlockRenderer({ block, slug, themeKey, appearance }: TreeBlockRendererProps) {
  if (block.type === 'separator') {
    return (
      <div className="w-full flex items-center justify-center my-6">
        <span className="w-1/2 h-px bg-slate-200/50 block"></span>
      </div>
    );
  }

  // Map block types to icons
  const getIcon = () => {
    switch (block.type) {
      case 'download': return <Download className="w-5 h-5" />;
      case 'publication': return <FileText className="w-5 h-5" />;
      case 'company': return <Share2 className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const isDark = themeKey === 'dark' || themeKey === 'neo';
  
  // Base button styles based on appearance settings
  const variant = appearance?.buttonStyle?.variant || 'solid';
  const rounding = appearance?.buttonStyle?.rounding || 'lg';
  
  const roundingClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-xl',
    'full': 'rounded-full'
  }[rounding];

  let bgClass = '';
  let borderClass = '';
  let textClass = '';
  let hoverClass = '';
  let shadowClass = 'shadow-sm';

  // Apply button variants
  if (variant === 'solid') {
    bgClass = isDark ? 'bg-white/10' : 'bg-white';
    borderClass = isDark ? 'border-white/5' : 'border-slate-200';
    textClass = appearance?.buttonStyle?.textColor || (isDark ? 'text-white' : 'text-slate-900');
    hoverClass = isDark ? 'hover:bg-white/20' : 'hover:bg-slate-50 hover:border-slate-300';
  } else if (variant === 'outline') {
    bgClass = 'bg-transparent';
    borderClass = `border-2 ${isDark ? 'border-white/20' : 'border-slate-900'}`;
    textClass = isDark ? 'text-white' : 'text-slate-900';
    hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  } else if (variant === 'glass') {
    bgClass = 'bg-white/10 backdrop-blur-md';
    borderClass = 'border border-white/20';
    textClass = 'text-white'; // glass usually looks best with white text
    hoverClass = 'hover:bg-white/20';
    shadowClass = 'shadow-xl';
  }

  // Override with custom color if provided
  if (appearance?.buttonStyle?.color && variant === 'solid') {
    // This requires inline styles for the exact hex
  }

  const customStyle: React.CSSProperties = {};
  if (appearance?.buttonStyle?.color && variant === 'solid') {
    customStyle.backgroundColor = appearance.buttonStyle.color;
    customStyle.borderColor = appearance.buttonStyle.color;
  }
  if (appearance?.buttonStyle?.textColor) {
    customStyle.color = appearance.buttonStyle.textColor;
  }

  return (
    <CreatorTreeLink
      slug={slug}
      blockId={block.id}
      href={block.url || '#'}
      className={cn(
        "group relative flex items-center w-full p-4 mb-4 transition-all duration-300 overflow-hidden",
        "border",
        roundingClass,
        bgClass,
        borderClass,
        textClass,
        hoverClass,
        shadowClass,
        "hover:-translate-y-1 hover:shadow-md"
      )}
      style={customStyle}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/10 mr-4">
        {getIcon()}
      </div>
      
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-[15px] leading-tight">
          {block.title}
        </h3>
        {block.subtitle && (
          <p className="text-sm opacity-80 mt-1 line-clamp-1">
            {block.subtitle}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight className="w-5 h-5" />
      </div>
    </CreatorTreeLink>
  );
}
