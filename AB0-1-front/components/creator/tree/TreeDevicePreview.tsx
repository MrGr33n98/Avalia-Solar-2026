import React from 'react';
import { PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { TreeRenderer } from './TreeRenderer';
import { ExternalLink } from 'lucide-react';

interface TreeDevicePreviewProps {
  data: PublicCreatorTreeResponse | null;
  publicUrl: string;
}

export function TreeDevicePreview({ data, publicUrl }: TreeDevicePreviewProps) {
  if (!data) return null;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.03)] h-full max-h-[800px] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Live Preview
        </p>
        <button 
          type="button" 
          onClick={() => publicUrl && window.open(publicUrl, '_blank')} 
          className="text-slate-400 hover:text-blue-600 transition-colors" 
          aria-label="Abrir em nova aba"
          disabled={!publicUrl}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 flex justify-center bg-slate-50 rounded-[20px] overflow-hidden border-4 border-slate-900 shadow-inner relative">
        {/* Device Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
          <div className="w-32 h-6 bg-slate-900 rounded-b-2xl"></div>
        </div>
        
        {/* Scrollable Container mimicking mobile view */}
        <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide pt-4">
          <div className="origin-top transform scale-[0.85] w-[117.6%] -ml-[8.8%] pb-12">
            <TreeRenderer data={data} previewMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
