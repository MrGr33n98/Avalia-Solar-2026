'use client';

import { motion } from 'framer-motion';
import { Check, Lock, X } from 'lucide-react';
import {
  pricingFeatureGroups,
  type Availability,
  type PricingFeatureRow,
} from '@/lib/pricing/catalog';

// ─── Variants ─────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.10 } },
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
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-1.5 text-xs font-semibold text-brand-blue ring-1 ring-brand-blue/20">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Comercial</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
        <X className="h-3 w-3 text-slate-350" />
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
      transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
    >
      <td className="rounded-l-2xl bg-slate-50/80 px-5 py-4 pr-5 transition-colors group-hover:bg-slate-100/80">
        <div className="text-sm font-semibold leading-snug text-slate-900">{row.label}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{row.description}</div>
      </td>
      <td className="bg-slate-50/80 px-3 py-4 text-center transition-colors group-hover:bg-slate-100/80">
        <AvailabilityCell value={row.availability.free} />
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
  return (
    <section className="border-y border-white/50 bg-white/30 py-16 backdrop-blur-sm md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="mb-10"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl"
          >
            Comparativo de recursos
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600"
          >
            O plano pago entrega mais conversão e menos distração competitiva.
            Cada categoria abaixo mostra exatamente o que muda entre os níveis.
          </motion.p>
        </motion.div>

        {/* Feature groups */}
        <motion.div
          className="space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
        >
          {pricingFeatureGroups.map((group) => (
            <motion.div
              key={group.id}
              variants={fadeUp}
              className="clay-precision overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/75 backdrop-blur-md"
            >
              {/* Group title */}
              <div className="border-b border-slate-100/80 px-6 py-5">
                <h3 className="text-base font-black tracking-tight text-slate-900">{group.title}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full border-separate border-spacing-y-2 p-4">
                  <thead>
                    <tr>
                      <th className="pb-1 pl-5 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 w-[45%]">
                        Funcionalidade
                      </th>
                      <th className="pb-1 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Gratuito
                      </th>
                      <th className="pb-1 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
                        Pro
                      </th>
                      <th className="pb-1 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
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
          ))}
        </motion.div>
      </div>
    </section>
  );
}
