'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { AchievementFaqItem } from '@/lib/api/achievements';

interface AchievementFaqAccordionProps {
  faq: AchievementFaqItem[];
}

export function AchievementFaqAccordion({ faq }: AchievementFaqAccordionProps) {
  if (!faq || faq.length === 0) return null;

  return (
    <section
      aria-label="Perguntas Frequentes sobre Conquistas"
      className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <div className="mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tire suas dúvidas sobre o programa de reconhecimento do Avalia Solar
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-1.5">
        {faq.map((item, index) => (
          <AccordionItem
            key={`faq-${index}`}
            value={`item-${index}`}
            className="border border-slate-100 dark:border-slate-800 rounded-md px-3 overflow-hidden"
          >
            <AccordionTrigger className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-left py-3">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-xs text-slate-600 dark:text-slate-400 pb-3 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
