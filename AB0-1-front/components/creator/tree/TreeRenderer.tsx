import React from 'react';
import { PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { TreeBackground } from './TreeBackground';
import { TreeHeader } from './TreeHeader';
import { TreeSocialBar } from './TreeSocialBar';
import { TreeBlockRenderer } from './TreeBlockRenderer';
import { TreeFooter } from './TreeFooter';
import { CreatorTreeAppearance } from '@/types/creator-tree';

interface TreeRendererProps {
  data: PublicCreatorTreeResponse;
  previewMode?: boolean;
}

export function TreeRenderer({ data, previewMode = false }: TreeRendererProps) {
  const { creator, blocks, appearance, theme_key } = data;
  
  // Safe parse appearance if it comes as string from API
  let parsedAppearance: CreatorTreeAppearance | undefined;
  if (appearance) {
    if (typeof appearance === 'string') {
      try {
        parsedAppearance = JSON.parse(appearance);
      } catch (e) {
        parsedAppearance = undefined;
      }
    } else {
      parsedAppearance = appearance as CreatorTreeAppearance;
    }
  }

  const themeKey = theme_key || 'solar';

  return (
    <TreeBackground themeKey={themeKey} appearance={parsedAppearance}>
      <div className="w-full max-w-2xl px-4 flex flex-col items-center">
        <TreeHeader 
          creator={creator} 
          themeKey={themeKey} 
          appearance={parsedAppearance} 
        />
        
        <TreeSocialBar
          creator={creator}
          themeKey={themeKey}
          appearance={parsedAppearance}
        />
        
        <div className="w-full flex flex-col items-center mt-2 space-y-1">
          {blocks.map((block) => (
            <TreeBlockRenderer
              key={block.id}
              block={block}
              slug={creator.slug}
              themeKey={themeKey}
              appearance={parsedAppearance}
            />
          ))}
          
          {blocks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              Nenhum link adicionado ainda.
            </div>
          )}
        </div>
        
        <TreeFooter themeKey={themeKey} appearance={parsedAppearance} />
      </div>
    </TreeBackground>
  );
}
