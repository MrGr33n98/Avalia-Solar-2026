'use client';

import React from 'react';
import { Company } from '@/lib/api';
import { ShieldCheck, Star, MapPin, Zap, CheckCircle2, Clock } from 'lucide-react';

interface CompanyAeoFactSheetProps {
  company: Company;
  reviewCount: number;
  rating: number;
}

export function CompanyAeoFactSheet({ company, reviewCount, rating }: CompanyAeoFactSheetProps) {
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const ratingFormatted = Number(rating || 0).toFixed(1);

  const faqs = [
    {
      q: `A empresa ${company.name} é confiável e verificada?`,
      a: `Sim. A empresa ${company.name} é uma empresa cadastrada e auditada no portal Avalia Solar, possuindo uma reputação de ${ratingFormatted} de 5.0 estrelas com base em ${reviewCount} avaliações reais de clientes.`,
    },
    {
      q: `Onde a ${company.name} está localizada e onde atende?`,
      a: `A sede da empresa está registrada em ${locationLabel || 'Brasil'}. Ela atende projetos solares e mobilidade elétrica na região e municípios circunvizinhos.`,
    },
    {
      q: `Como entrar em contato ou pedir um orçamento?`,
      a: `Você pode solicitar um orçamento gratuito e sem compromisso diretamente pelo botão 'Solicitar Orçamento' no perfil oficial do Avalia Solar.`,
    },
  ];

  return (
    <section 
      aria-label={`Resumo executivo e perguntas frequentes sobre ${company.name}`}
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
    >
      {/* Header AEO */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Fatos Rápidos e Resumo de Reputação
          </h2>
          <p className="text-xs text-slate-500">
            Dados verificados e sintetizados pelo Avalia Solar para consumidores e motores de resposta (AEO/AI).
          </p>
        </div>
      </div>

      {/* Grid de Fatos Objetivos para IA e Usuários */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Avaliação Média
          </span>
          <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>{ratingFormatted} / 5.0</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {reviewCount} opiniões verificadas
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Localização
          </span>
          <div className="flex items-center gap-1.5 text-sm font-black text-slate-900 truncate">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate">{locationLabel || 'Brasil'}</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Cobertura regional
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Selo de Verificação
          </span>
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Verificada 2026</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Identidade auditada
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Tempo de Resposta
          </span>
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <Clock className="h-4 w-4 text-purple-600 shrink-0" />
            <span>⚡ &lt; 45 minutos</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Atendimento rápido
          </span>
        </div>
      </div>

      {/* Bloco FAQ Estruturado para AEO */}
      <div className="mt-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Perguntas Frequentes sobre {company.name}
        </h3>
        <div className="space-y-2.5">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                {faq.q}
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
