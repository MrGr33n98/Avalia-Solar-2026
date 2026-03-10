'use client';

import { Trophy, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/lib/api';
import { openQuoteWizard } from '@/lib/quote-wizard';

interface Props {
  company: Company;
  rank: number;
}

export default function Top1StickyCTA({ company, rank }: Props) {
  if (rank !== 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-[calc(5rem+var(--safe-area-inset-bottom))] left-[max(1rem,var(--safe-area-inset-left))] right-[max(1rem,var(--safe-area-inset-right))] z-50 md:hidden"
      >
        <div className="bg-slate-900 border-2 border-amber-400/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-slate-900 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">
                Líder da Região
              </p>
              <h4 className="text-white font-bold text-sm leading-tight line-clamp-1">
                {company.name}
              </h4>
            </div>
          </div>

          <Button 
            onClick={() =>
              openQuoteWizard({
                source: 'top1-sticky-cta',
                preferredCompanyId: company.id,
              })
            }
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs px-4 h-10 rounded-xl shadow-lg transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Falar Agora
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
