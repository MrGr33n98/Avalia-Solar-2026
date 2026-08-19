'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Award, ArrowUpRight, TrendingUp } from 'lucide-react';

export function FeedRightRail() {
  return (
    <aside className="space-y-4">
      {/* Featured Companies */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span>Empresas em Destaque</span>
        </div>
        <div className="space-y-3 text-xs">
          <Link href="/companies" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors">
            <div>
              <p className="font-medium text-foreground">GoodWe Brasil</p>
              <p className="text-muted-foreground">Inversores & Baterias • ★ 4.9</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/companies" className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors">
            <div>
              <p className="font-medium text-foreground">Sungrow Power</p>
              <p className="text-muted-foreground">Tecnologia Solar • ★ 4.8</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          <span>Assuntos em Alta</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-muted font-medium hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">#InversoresHibridos</span>
          <span className="px-2.5 py-1 rounded-full bg-muted font-medium hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">#MercadoLivreEnergia</span>
          <span className="px-2.5 py-1 rounded-full bg-muted font-medium hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">#BateriasLithium</span>
          <span className="px-2.5 py-1 rounded-full bg-muted font-medium hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">#RegulacaoANEEL</span>
        </div>
      </div>
    </aside>
  );
}
