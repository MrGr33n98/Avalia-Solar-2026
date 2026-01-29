'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/hooks/useComparison';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';

export default function ComparisonFloatingBar() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();

  if (comparisonList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
      >
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-3 md:p-4 backdrop-blur-lg bg-opacity-95">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              
              <div className="flex items-center gap-2">
                {comparisonList.map((company) => (
                  <div 
                    key={company.id} 
                    className="relative group flex-shrink-0"
                  >
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white p-1 overflow-hidden border-2 border-slate-700">
                      <img 
                        src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'} 
                        alt={company.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => removeFromComparison(company.id)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg scale-0 group-hover:scale-100 transition-transform"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {comparisonList.length < 3 && (
                  <div className="hidden sm:flex h-10 w-10 md:h-12 md:w-12 rounded-xl border-2 border-dashed border-slate-700 items-center justify-center text-slate-500">
                    <span className="text-xs font-bold">+{3 - comparisonList.length}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearComparison}
                className="hidden md:flex text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold whitespace-nowrap">
                <Link href="/compare">
                  Comparar {comparisonList.length} {comparisonList.length === 1 ? 'Empresa' : 'Empresas'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
