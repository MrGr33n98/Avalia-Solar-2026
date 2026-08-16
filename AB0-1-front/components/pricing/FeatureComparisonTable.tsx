'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Check, Lock, X, ChevronDown } from 'lucide-react';
import {
  pricingFeatureGroups,
  type Availability,
  type PricingFeatureRow,
} from '@/lib/pricing/catalog';
import { Button } from '@/components/ui/button';
import { CompactComparison } from './CompactComparison';

// ─── Variants ─────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Cell Component ────────────────────────────────────────────────────────

interface AvailabilityCellProps {
  value: Availability;
}

export function AvailabilityCell({ value }: AvailabilityCellProps) {
  if (value === 'included') {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-1.5 text-xs font-semibold text-brand-blue ring-1 ring-brand-blue/20">
        <Check className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Incluído</span>
      </span>
    );
  }
  if (value === 'contact_sales') {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900/10 px-2.5 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-900/20">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Comercial</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
        <X className="h-3 w-3 text-slate-400" />
      </span>
    </span>
  );
}

// ─── Row Component ─────────────────────────────────────────────────────────

interface CompareRowProps {
  row: PricingFeatureRow;
}

export function CompareRow({ row }: CompareRowProps) {
  return (
    <motion.tr
      className="group align-middle"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] as const }}
    >
      <td className="rounded-l-2xl bg-slate-50/80 px-5 py-4 pr-5 transition-colors group-hover:bg-slate-100/80">
        <div className="text-sm font-semibold leading-snug text-slate-900">{row.label}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{row.description}</div>
      </td>
      <td className="bg-slate-50/80 px-3 py-4 text-center transition-colors group-hover:bg-slate-100/80">
        <AvailabilityCell value={row.availability.free} />
      </td>
      <td className="bg-slate-50/80 px-3 py-4 text-center transition-colors group-hover:bg-slate-100/80">
        <AvailabilityCell value={row.availability.essential} />
      </td>
      <td className="bg-slate-50/80 px-3 py-4 text-center transition-colors group-hover:bg-slate-100/80">
        <AvailabilityCell value={row.availability.pro} />
      </td>
      <td className="rounded-r-2xl bg-slate-50/80 px-3 py-4 text-center transition-colors group-hover:bg-slate-100/80">
        <AvailabilityCell value={row.availability.enterprise} />
      </td>
    </motion.tr>
  );
}

// ─── Main Comparison Table Component ─────────────────────────────────────────

export function FeatureComparisonTable() {
  // Main toggle state to show/hide the detailed features
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Accordion state for subgroups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'public-profile': true, // Primeiro grupo aberto por padrão
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="border-y border-white/50 bg-white/30 py-16 backdrop-blur-sm md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="mb-12"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl"
          >
            Comparativo de recursos
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 font-medium"
          >
            Escolha o nível que melhor atende aos objetivos de captação e inteligência comercial de
            sua empresa.
          </motion.p>
        </motion.div>

        {/* 1. Comparativo Compacto (Primeiro Diferencial Rápido com as Melhores Features) */}
        <CompactComparison />

        {/* Botão Dropdown Principal para mostrar as demais features */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            variant="outline"
            className="rounded-full px-6 py-5 font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 gap-2 shadow-sm"
          >
            <span>
              {showAllFeatures
                ? 'Ocultar comparativo completo'
                : 'Ver comparativo de todas as funcionalidades'}
            </span>
            <motion.div
              animate={{ rotate: showAllFeatures ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>

        {/* 2. Comparativo Detalhado (As Demais Features) */}
        <AnimatePresence initial={false}>
          {showAllFeatures && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {/* Cabeçalho da tabela de detalhes */}
              <div className="mb-6 mt-4">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  Comparativo Detalhado de Funcionalidades
                </h4>
              </div>

              {/* Feature groups como Accordions */}
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={stagger}
              >
                {pricingFeatureGroups.map((group) => {
                  const isExpanded = !!expandedGroups[group.id];

                  return (
                    <motion.div
                      key={group.id}
                      variants={fadeUp}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300"
                    >
                      {/* Clickable Accordion Header */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between border-b border-slate-100/50 px-6 py-5 bg-slate-50/40 hover:bg-slate-100/40 transition-colors duration-200 text-left"
                      >
                        <h3 className="text-base font-black tracking-tight text-slate-900">
                          {group.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-wider">
                            {isExpanded ? 'Ocultar tabela' : 'Expandir tabela'}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="text-slate-400"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        </div>
                      </button>

                      {/* Smooth Expandable Content */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="overflow-x-auto">
                              <table className="min-w-0 w-full border-separate border-spacing-y-2 p-4">
                                <thead>
                                  <tr>
                                    <th className="pb-1 pl-5 pr-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 w-[40%]">
                                      Funcionalidade
                                    </th>
                                    <th className="pb-1 px-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Gratuito
                                    </th>
                                    <th className="pb-1 px-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                                      Essencial
                                    </th>
                                    <th className="pb-1 px-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                      Pro
                                    </th>
                                    <th className="pb-1 px-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                                      Enterprise
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.rows.map((row) => (
                                    <CompareRow key={row.key} row={row} />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
