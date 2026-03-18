'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  MessageSquare,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  pricingFaqs,
  pricingFeatureGroups,
  pricingPlans,
  type Availability,
  type PlanSlug,
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

const cardVariant = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 26 },
  },
};

// ─── Plan visual config ────────────────────────────────────────────────────

interface PlanConfig {
  topBar: string;
  iconBg: string;
  accentText: string;
  badgeCls: string;
  ringCls: string;
  shadowCls: string;
  ctaCls: string;
  checkBg: string;
  checkText: string;
}

const planConfig: Record<PlanSlug, PlanConfig> = {
  free: {
    topBar: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
    iconBg: 'bg-slate-900',
    accentText: 'text-slate-900',
    badgeCls: '',
    ringCls: '',
    shadowCls: 'shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]',
    ctaCls: 'clay-chip border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
    checkBg: 'bg-slate-100',
    checkText: 'text-slate-500',
  },
  pro: {
    topBar: 'bg-gradient-to-r from-brand-green via-emerald-400 to-brand-green',
    iconBg: 'bg-brand-green',
    accentText: 'text-brand-green',
    badgeCls: 'border border-brand-green/25 bg-brand-green/10 text-brand-green',
    ringCls: 'ring-2 ring-brand-green/30',
    shadowCls: 'shadow-[0_28px_64px_-20px_rgba(52,199,89,0.32)]',
    ctaCls: 'bg-brand-green hover:bg-brand-green/90 text-white border-0',
    checkBg: 'bg-brand-green/10',
    checkText: 'text-brand-green',
  },
  enterprise: {
    topBar: 'bg-gradient-to-r from-brand-purple via-violet-400 to-brand-purple',
    iconBg: 'bg-brand-purple',
    accentText: 'text-brand-purple',
    badgeCls: 'border border-brand-purple/25 bg-brand-purple/10 text-brand-purple',
    ringCls: 'ring-2 ring-brand-purple/25',
    shadowCls: 'shadow-[0_28px_64px_-20px_rgba(108,92,231,0.22)]',
    ctaCls: 'bg-brand-purple hover:bg-brand-purple/90 text-white border-0',
    checkBg: 'bg-brand-purple/10',
    checkText: 'text-brand-purple',
  },
};

const planIcon = { free: Building2, pro: Zap, enterprise: ShieldCheck };

// ─── Availability cell ─────────────────────────────────────────────────────

function AvailabilityCell({ value }: { value: Availability }) {
  if (value === 'included') {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
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

// ─── Table row with hover animation ───────────────────────────────────────

function CompareRow({ row }: { row: PricingFeatureRow }) {
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

// ─── FAQ Accordion ─────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div layout className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 backdrop-blur-sm clay-precision">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold leading-snug text-slate-900">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown className="h-5 w-5" />
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
            <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <main className="relative overflow-hidden" style={{ background: 'hsl(222 47% 95%)' }}>

      {/* Ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[640px] w-[640px] rounded-full bg-brand-blue/[0.07] blur-[120px]" />
        <div className="absolute right-0 top-10 h-[520px] w-[520px] rounded-full bg-brand-green/[0.06] blur-[100px]" />
        <div className="absolute left-1/2 top-[55%] h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-brand-purple/[0.05] blur-[120px]" />
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative border-b border-white/50 pb-16 pt-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="clay-precision-chip mb-6 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.22em]"
              >
                Planos e Entitlements
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-balance text-4xl font-black tracking-tight text-slate-950 md:text-5xl lg:text-[3.5rem]"
            >
              Preços pensados para{' '}
              <span className="text-brand-blue">presença</span>,{' '}
              <span className="text-brand-green">conversão</span>
              {' '}e operação comercial madura.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
            >
              O gratuito garante{' '}
              <strong className="text-slate-800">presença mínima</strong> no marketplace.
              O Pro transforma seu perfil em{' '}
              <strong className="text-brand-green">vitrine comercial ativa</strong>.
              O Enterprise adiciona{' '}
              <strong className="text-brand-purple">inteligência de mercado e governança</strong>.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="clay-btn-primary h-12 rounded-full px-8">
                <Link href="/register">
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="clay-chip h-12 rounded-full border-white/80 bg-white/70 px-8 backdrop-blur-sm"
              >
                <Link href="/contact">Falar com vendas</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="grid gap-5 xl:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {pricingPlans.map((plan) => {
              const Icon = planIcon[plan.slug];
              const cfg = planConfig[plan.slug];

              return (
                <motion.div
                  key={plan.slug}
                  variants={cardVariant}
                  className={[
                    'relative flex flex-col overflow-hidden rounded-[2rem] border border-white/60',
                    'bg-white/80 backdrop-blur-md',
                    plan.slug === 'pro' ? 'clay-convex' : 'clay-card',
                    cfg.ringCls,
                    cfg.shadowCls,
                  ].join(' ')}
                >
                  {/* Top accent bar */}
                  <div className={`h-[5px] w-full ${cfg.topBar}`} />

                  <div className="flex flex-1 flex-col p-7">
                    {/* Plan header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${cfg.iconBg} text-white shadow-lg`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xl font-black tracking-tight text-slate-950">
                              {plan.name}
                            </div>
                            <div className="text-xs text-slate-500">{plan.billingNote}</div>
                          </div>
                        </div>

                        {plan.badge && (
                          <motion.div
                            className="inline-block"
                            animate={
                              plan.slug === 'pro'
                                ? { scale: [1, 1.045, 1] }
                                : {}
                            }
                            transition={
                              plan.slug === 'pro'
                                ? { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }
                                : {}
                            }
                          >
                            <Badge
                              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${cfg.badgeCls}`}
                            >
                              {plan.badge}
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <div className={`text-xl font-black tracking-tight ${cfg.accentText}`}>
                          {plan.priceLabel}
                        </div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          {plan.slug === 'free' ? 'Para sempre' : plan.slug === 'pro' ? 'Mensal' : 'Personalizado'}
                        </div>
                      </div>
                    </div>

                    <div className="my-5 h-px bg-slate-100/80" />

                    {/* Summary */}
                    <p className="text-sm leading-relaxed text-slate-600">{plan.summary}</p>

                    {/* Highlights */}
                    <ul className="mt-5 flex-1 space-y-3">
                      {plan.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3 text-sm text-slate-700">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cfg.checkBg} ${cfg.checkText}`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      asChild
                      size="lg"
                      className={`mt-7 h-12 w-full rounded-full font-semibold transition-all ${cfg.ctaCls}`}
                    >
                      <Link href={plan.ctaHref}>
                        {plan.ctaLabel}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
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
                        <th className="pb-1 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-green">
                          Pro
                        </th>
                        <th className="pb-1 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-purple">
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

      {/* ── FAQ + CARDS ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="grid gap-6 lg:grid-cols-[1fr_0.8fr]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {/* FAQs */}
            <motion.div variants={fadeUp}>
              <h2 className="mb-6 text-2xl font-black tracking-tight text-slate-950">
                Dúvidas frequentes
              </h2>
              <div className="space-y-3">
                {pricingFaqs.map((faq) => (
                  <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </motion.div>

            {/* Side cards */}
            <motion.div variants={fadeUp} className="space-y-5">
              {/* How it works */}
              <div className="clay-precision rounded-[2rem] border border-slate-800/10 bg-slate-950 p-7 text-white">
                <h3 className="mb-5 text-xl font-black tracking-tight">
                  Como funciona na prática
                </h3>
                <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                  {[
                    { color: 'bg-brand-blue/20 text-brand-blue', text: <><strong className="text-white">Plano</strong> define o entitlement canônico em <code className="rounded bg-white/10 px-1 font-mono text-xs">features_json</code>.</> },
                    { color: 'bg-brand-green/20 text-brand-green', text: <><strong className="text-white">Dashboard</strong> exibe cada feature como <code className="rounded bg-white/10 px-1 font-mono text-xs">enabled</code>, <code className="rounded bg-white/10 px-1 font-mono text-xs">locked</code> ou <code className="rounded bg-white/10 px-1 font-mono text-xs">hidden</code>.</> },
                    { color: 'bg-brand-purple/20 text-brand-purple', text: <><strong className="text-white">Perfil público</strong> renderiza ou suprime CTAs, banners e blocos competitivos conforme o plano.</> },
                    { color: 'bg-white/10 text-white/60', text: <><strong className="text-white">Backend</strong> aplica enforcement real: o blur é UX de upsell, não segurança falsa.</> },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales CTA */}
              <div className="clay-precision rounded-[2rem] border border-brand-blue/15 bg-gradient-to-br from-brand-blue/5 via-white to-white p-7">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">Falar com vendas</h3>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Precisa de proposta personalizada, integração específica ou condições especiais para sua operação?
                </p>
                <Button asChild size="lg" className="clay-btn-primary h-11 w-full rounded-full">
                  <Link href="/contact">
                    Entrar em contato
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
