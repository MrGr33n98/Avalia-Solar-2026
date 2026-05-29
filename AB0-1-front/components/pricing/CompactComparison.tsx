'use client';

import React from 'react';
import { Check, X, Shield, Sparkles, Zap, MessageSquare, Compass, ShieldCheck } from 'lucide-react';

interface CompactFeature {
  name: string;
  description: string;
  free: string | React.ReactNode;
  essential: string | React.ReactNode;
  pro: string | React.ReactNode;
  enterprise: string | React.ReactNode;
}

export function CompactComparison() {
  const features: CompactFeature[] = [
    {
      name: 'Presença e Visibilidade',
      description: 'Como sua empresa aparece na busca',
      free: <span className="text-slate-500 font-medium text-xs">Orgânica Básica</span>,
      essential: <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1">✓ Destaque Visual</span>,
      pro: <span className="text-brand-blue font-black text-xs flex items-center justify-center gap-1">★ Vitrine Premium</span>,
      enterprise: <span className="text-slate-900 font-black text-xs flex items-center justify-center gap-1">✦ Posicionamento Exclusivo</span>,
    },
    {
      name: 'Geração de Contatos (CTA)',
      description: 'Botões de ação direta no perfil',
      free: <span className="text-slate-400 text-xs flex items-center justify-center"><X className="h-3.5 w-3.5 mr-1" /> Indisponível</span>,
      essential: <span className="text-emerald-600 font-bold text-xs">Botão de WhatsApp</span>,
      pro: <span className="text-brand-blue font-bold text-xs">CTAs Dinâmicos + WhatsApp</span>,
      enterprise: <span className="text-slate-900 font-bold text-xs">CTAs Customizados Ilimitados</span>,
    },
    {
      name: 'Fuga de Atenção (Concorrentes)',
      description: 'Exibição de alternativas no seu perfil',
      free: <span className="text-red-500 font-medium text-xs">Com Anúncios de Concorrentes</span>,
      essential: <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Sem Concorrentes</span>,
      pro: <span className="text-brand-blue font-bold text-xs flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Sem Concorrentes</span>,
      enterprise: <span className="text-slate-900 font-bold text-xs flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Sem Concorrentes</span>,
    },
    {
      name: 'Leads e Integrações',
      description: 'Métricas, CRM e equipe comercial',
      free: <span className="text-slate-400 text-xs flex items-center justify-center"><X className="h-3.5 w-3.5 mr-1" /> Indisponível</span>,
      essential: <span className="text-slate-400 text-xs flex items-center justify-center"><X className="h-3.5 w-3.5 mr-1" /> Indisponível</span>,
      pro: <span className="text-brand-blue font-semibold text-xs">Analytics de Tráfego</span>,
      enterprise: <span className="text-slate-900 font-black text-xs">Webhooks + Sinais de Intenção</span>,
    },
  ];

  return (
    <div className="w-full bg-gradient-to-br from-white to-slate-50/50 rounded-3xl border border-white/60 p-6 md:p-8 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.06)] clay-card mb-12">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-950 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-blue animate-pulse" />
            Comparativo Rápido de Recursos
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Veja as principais diferenças que impulsionam os resultados comerciais da sua empresa.
          </p>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50 self-start md:self-auto">
          Visão Geral
        </span>
      </div>

      <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 w-[30%]">Diferencial</th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Gratuito</th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-wider text-emerald-600">Essencial</th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-wider text-brand-blue">Pro</th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-900">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {features.map((feature, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40 transition-colors duration-150">
                <td className="py-4 pr-4">
                  <div className="text-xs font-black text-slate-900">{feature.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">{feature.description}</div>
                </td>
                <td className="py-4 text-center text-xs font-semibold text-slate-600 bg-slate-50/10">{feature.free}</td>
                <td className="py-4 text-center text-xs font-bold text-teal-700 bg-emerald-50/5">{feature.essential}</td>
                <td className="py-4 text-center text-xs font-extrabold text-brand-blue-dark bg-brand-blue/5">{feature.pro}</td>
                <td className="py-4 text-center text-xs font-black text-slate-950 bg-slate-900/5">{feature.enterprise}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
