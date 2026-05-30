'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { pricingFaqs } from '@/lib/pricing/catalog';

interface FaqItemProps {
  question: string;
  answer: string;
}

export function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <span className="font-semibold text-sm leading-snug text-slate-900">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingFaq() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">

          {/* Esquerda: FAQ */}
          <div>
            <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-950">
              Dúvidas frequentes
            </h2>
            <p className="mb-6 text-sm text-slate-500 font-medium">
              Respostas rápidas para as perguntas mais comuns.
            </p>
            <div className="space-y-3">
              {pricingFaqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          {/* Direita: Card de ajuda */}
          <div className="rounded-[1.5rem] border border-brand-blue/15 bg-gradient-to-br from-brand-blue/5 via-white to-white p-6 shadow-sm flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-md shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950 leading-tight mb-2">
                Precisa de ajuda para escolher?
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Fale com nosso time e encontre o plano ideal para seus objetivos comerciais.
              </p>
            </div>
            <Button asChild className="bg-brand-blue hover:bg-brand-blue-light text-white border-0 shadow-sm h-11 rounded-full font-bold text-sm w-full">
              <Link href="/contact?subject=commercial">
                Falar com vendas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
