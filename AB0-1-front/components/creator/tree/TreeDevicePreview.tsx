import React, { useState } from 'react';
import { PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { TreeRenderer } from './TreeRenderer';
import { ExternalLink, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeDevicePreviewProps {
  data: PublicCreatorTreeResponse | null;
  publicUrl: string;
}

export function TreeDevicePreview({ data, publicUrl }: TreeDevicePreviewProps) {
  const [mode, setMode] = useState<'mobile' | 'desktop'>('mobile');

  if (!data) return null;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.03)] h-full max-h-[800px] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Live Preview
        </p>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setMode('mobile')}
              className={cn("p-1.5 rounded-md transition-colors", mode === 'mobile' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode('desktop')}
              className={cn("p-1.5 rounded-md transition-colors", mode === 'desktop' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => publicUrl && window.open(publicUrl, '_blank')} 
            className="text-slate-400 hover:text-blue-600 transition-colors p-2" 
            aria-label="Abrir em nova aba"
            disabled={!publicUrl}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className={cn(
        "flex-1 flex justify-center bg-slate-50 overflow-hidden relative transition-all duration-500",
        mode === 'mobile' 
          ? "rounded-[32px] border-8 border-slate-900 shadow-inner max-w-[360px] mx-auto w-full" 
          : "rounded-xl border border-slate-200 shadow-sm w-full"
      )}>
        {/* Device Notch */}
        {mode === 'mobile' && (
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
            <div className="w-32 h-6 bg-slate-900 rounded-b-xl"></div>
          </div>
        )}
        
        {/* Scrollable Container */}
        <div className={cn(
          "w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide",
          mode === 'mobile' ? "pt-6" : ""
        )}>
          <div className={cn(
            "origin-top transform pb-12 w-full",
            mode === 'mobile' ? "scale-[0.85] w-[117.6%] -ml-[8.8%]" : ""
          )}>
            <TreeRenderer data={data} previewMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
