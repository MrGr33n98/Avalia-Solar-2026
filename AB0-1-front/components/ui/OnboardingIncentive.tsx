'use client';

import { motion } from 'framer-motion';
import { Copy, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type OnboardingIncentiveProps = {
  reviewLink: string;
  onStart?: () => void;
  className?: string;
};

export default function OnboardingIncentive({ reviewLink, onStart, className }: OnboardingIncentiveProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reviewLink);
      toast.success('Link copiado para a área de transferência!');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'w-full rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3',
        'flex flex-col md:flex-row md:items-center gap-3 md:gap-4',
        className
      )}
      aria-label="Incentivo de onboarding"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
          <Star className="h-4 w-4 text-amber-600 fill-amber-400" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-amber-900">
            Arranje as primeiras avaliações para o Avaliasolar!
          </div>
          <div className="text-xs text-amber-800/80 leading-relaxed">
            Mais avaliações aumentam sua confiança e melhoram sua visibilidade no portal.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onStart}
          className="h-9 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
        >
          Começar agora
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="h-9 px-3 text-xs font-semibold border-amber-300 bg-white hover:bg-amber-50 text-amber-900"
          aria-label="Copiar link"
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copiar link
        </Button>
      </div>
    </motion.section>
  );
}

