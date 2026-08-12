'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdvertisingStore } from '@/store/useAdvertisingStore';
import { Sparkles } from 'lucide-react';

interface CampaignTopBannerProps {
  className?: string;
}

export function CampaignTopBanner({ className }: CampaignTopBannerProps) {
  const { activeCampaign, fetchActiveCampaign, subscribeToUpdates, unsubscribeFromUpdates } = useAdvertisingStore();

  useEffect(() => {
    fetchActiveCampaign();
    subscribeToUpdates();
    return () => unsubscribeFromUpdates();
  }, [fetchActiveCampaign, subscribeToUpdates, unsubscribeFromUpdates]);

  if (!activeCampaign || !activeCampaign.image_url) {
    return null;
  }

  const targetLink = activeCampaign.target_url || '#';

  return (
    <div className={className}>
      <Link href={targetLink} className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm transition-all hover:border-blue-500/50 hover:shadow-md">
        <div className="relative aspect-[4/1] w-full overflow-hidden rounded-xl bg-slate-50 md:aspect-[6/1] lg:aspect-[8/1]">
          <Image
            src={activeCampaign.image_url}
            alt={activeCampaign.name}
            fill
            className="object-contain"
            sizes="(max-width: 1240px) 100vw, 1240px"
          />
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            <span>Patrocinado</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
