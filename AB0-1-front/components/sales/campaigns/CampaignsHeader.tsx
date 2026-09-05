'use client';

import React from 'react';
import Link from 'next/link';
import { Megaphone, Plus, Users, FileText, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CampaignsHeaderProps {
  onCreateCampaign: () => void;
}

export default function CampaignsHeader({ onCreateCampaign }: CampaignsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <Megaphone className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Campaigns & Outbound Marketing</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Orquestre disparo de e-mails em lote, audiências segmentadas, sequências drip e atribuição de receita.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard/sales/campaigns/audiences">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-500" /> Audiências
          </Button>
        </Link>

        <Link href="/dashboard/sales/campaigns/templates">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-500" /> Templates
          </Button>
        </Link>

        <Link href="/dashboard/sales/campaigns/sequences">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-300">
            <Layers className="w-3.5 h-3.5 text-slate-500" /> Sequências Drip
          </Button>
        </Link>

        <Button
          onClick={onCreateCampaign}
          size="sm"
          className="h-8 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white shadow-xs gap-1.5"
        >
          <Plus className="w-4 h-4 text-emerald-400" /> Criar Nova Campanha
        </Button>
      </div>
    </div>
  );
}
