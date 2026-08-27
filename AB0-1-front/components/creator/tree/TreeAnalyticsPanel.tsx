import React from 'react';
import { Eye, MousePointerClick, Link2, Crown } from 'lucide-react';
import { type CreatorTreeBlock } from '@/lib/api/creatorTree';

interface TreeAnalyticsPanelProps {
  blocks: CreatorTreeBlock[];
  treeViews: number;
}

export function TreeAnalyticsPanel({ blocks, treeViews }: TreeAnalyticsPanelProps) {
  const totalClicks = blocks.reduce((sum, block) => sum + (block.clicks_count || 0), 0);
  const activeBlocks = blocks.filter((block) => block.active).length;

  return (
    <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-[16px] border border-slate-200 bg-white p-4">
        <Eye className="h-4 w-4 text-blue-600" />
        <p className="mt-3 text-2xl font-black text-slate-950">{treeViews}</p>
        <p className="text-xs font-medium text-slate-500">Visualizações <span className="text-emerald-600">↑ 18%</span></p>
        <p className="mt-1 text-[10px] text-slate-400">Últimos 30 dias</p>
      </div>
      <div className="rounded-[16px] border border-slate-200 bg-white p-4">
        <MousePointerClick className="h-4 w-4 text-emerald-600" />
        <p className="mt-3 text-2xl font-black text-slate-950">{totalClicks}</p>
        <p className="text-xs font-medium text-slate-500">Cliques <span className="text-slate-400">0%</span></p>
        <p className="mt-1 text-[10px] text-slate-400">Últimos 30 dias</p>
      </div>
      <div className="rounded-[16px] border border-slate-200 bg-white p-4">
        <Link2 className="h-4 w-4 text-blue-600" />
        <p className="mt-3 text-2xl font-black text-slate-950">{activeBlocks} <span className="text-sm font-normal text-slate-400">de 8</span></p>
        <p className="text-xs font-medium text-slate-500">Links ativos</p>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${Math.min(activeBlocks / 8 * 100, 100)}%` }} />
        </div>
      </div>
      <div className="rounded-[16px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
        <Crown className="h-4 w-4 text-amber-500" />
        <p className="mt-3 text-sm font-black text-slate-900">Creator Pro</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Tenha mais links, análises avançadas e muito mais.</p>
        <button type="button" className="mt-2 rounded-lg bg-blue-100 px-3 py-1.5 text-[11px] font-bold text-blue-700">Conhecer planos</button>
      </div>
    </section>
  );
}
