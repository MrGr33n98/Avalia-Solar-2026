'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import type { AchievementFaqItem } from '@/lib/api/achievements';

interface AchievementFaqAccordionProps {
  faq: AchievementFaqItem[];
}

export function AchievementFaqAccordion({ faq }: AchievementFaqAccordionProps) {
  if (!faq || faq.length === 0) return null;

  return (
    <section
      aria-label="Perguntas Frequentes sobre Conquistas"
      className="mt-12 p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tire suas dúvidas sobre o programa de reconhecimento do Avalia Solar
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-2">
        {faq.map((item, index) => (
          <AccordionItem
            key={`faq-${index}`}
            value={`item-${index}`}
            className="border border-slate-100 dark:border-slate-800 rounded-2xl px-4 overflow-hidden"
          >
            <AccordionTrigger className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-left py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
