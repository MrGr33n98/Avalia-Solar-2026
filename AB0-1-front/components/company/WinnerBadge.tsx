'use client';

import { Trophy, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  companyName: string;
  rank: number;
  city: string;
  year?: number;
  className?: string;
}

const RANK_CONFIG = {
  1: { 
    label: 'OURO', 
    color: 'from-[#D4AF37] via-[#F1D592] to-[#D4AF37]', 
    text: 'text-[#D4AF37]',
    border: 'border-[#D4AF37]/30'
  },
  2: { 
    label: 'PRATA', 
    color: 'from-[#C0C0C0] via-[#E8E8E8] to-[#C0C0C0]', 
    text: 'text-[#C0C0C0]',
    border: 'border-[#C0C0C0]/30'
  },
  3: { 
    label: 'BRONZE', 
    color: 'from-[#CD7F32] via-[#E3AD81] to-[#CD7F32]', 
    text: 'text-[#CD7F32]',
    border: 'border-[#CD7F32]/30'
  },
} as const;

export default function WinnerBadge({ companyName, rank, city, year = 2026, className }: Props) {
  const config = RANK_CONFIG[rank as keyof typeof RANK_CONFIG];
  if (!config) return null;

  return (
    <Card className={cn("overflow-hidden border-2 shadow-2xl bg-slate-950", config.border, className)}>
      <CardContent className="p-0 relative">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col items-center text-center p-8 gap-6 relative z-10">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br shadow-[0_0_30px_rgba(212,175,55,0.3)]",
            config.color
          )}>
            <Trophy className="w-12 h-12 text-slate-900" />
          </div>

          <div className="space-y-2">
            <h4 className={cn("text-xs font-black tracking-[0.2em] uppercase", config.text)}>
              Empresa {config.label} {year}
            </h4>
            <h3 className="text-2xl font-black text-white leading-tight">
              {companyName}
            </h3>
            <p className="text-slate-400 text-sm font-medium">
              Eleita entre as 3 melhores de <span className="text-white">{city}</span>
            </p>
          </div>

          <div className="w-full h-px bg-slate-800" />

          <div className="flex gap-3 w-full">
            <Button className="flex-1 bg-white hover:bg-slate-100 text-slate-950 font-bold gap-2">
              <Download className="w-4 h-4" /> Baixar Selo
            </Button>
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 font-bold gap-2">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
