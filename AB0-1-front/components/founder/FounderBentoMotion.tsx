'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  Check,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default function FounderBentoMotion() {
  const shouldReduceMotion = useReducedMotion();
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);

  // Efeito de Count-up para métricas (05 Count-up stats)
  useEffect(() => {
    if (!hasEnteredView) return;
    if (shouldReduceMotion) {
      setAnimatedCount(1840);
      return;
    }

    let start = 0;
    const end = 1840;
    const duration = 1800;
    const stepTime = 25;
    const increment = (end / (duration / stepTime));

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedCount(end);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [hasEnteredView, shouldReduceMotion]);

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: shouldReduceMotion ? 0 : i * 0.1,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#d0d7de]">
      {/* Cabeçalho da Seção */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Arquitetura Funcional Bento · Módulos da Plataforma
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#09172f] tracking-tight">
          Estrutura técnica desenhada para conversão e autoridade
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#475569]">
          Conheça cada módulo que compõe a experiência da Brand Page. Distinguimos com clareza o pacote
          garantido no programa de lançamento dos módulos opcionais sob demanda.
        </p>
      </div>

      {/* Grid Bento Responsivo (3 colunas em desktop) */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        onViewportEnter={() => setHasEnteredView(true)}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* CARD 1: CATÁLOGO DINÂMICO DE PRODUTOS (Span 2 colunas em telas grandes) */}
        <motion.div
          className="lg:col-span-2 rounded-2xl border-2 border-[#09172f] bg-white p-6 sm:p-8 shadow-lg flex flex-col justify-between"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="font-mono text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded uppercase tracking-wider">
                CATÁLOGO TÉCNICO OFICIAL
              </span>
              <span className="font-mono text-xs font-bold text-[#146a4c] bg-[#e8f8f0] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
                INCLUSO NO LANÇAMENTO
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#09172f]">
              Vitrine de Inversores, Baterias e Sistemas Homologados
            </h3>
            <p className="mt-2 text-sm text-[#475569] leading-relaxed max-w-2xl">
              Apresente suas soluções com especificações técnicas completas, imagens em alta resolução e canal
              de solicitação direta para integradores e consumidores finais.
            </p>

            {/* Micro-demonstração animada da vitrine */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 font-bold text-xs">
                  INV
                </div>
                <h4 className="text-xs font-bold text-[#09172f]">Inversores Híbridos</h4>
                <p className="text-[11px] text-slate-500 mt-1">Potências de 5kW a 100kW com monitoramento Wi-Fi.</p>
                <span className="mt-2 inline-block text-[10px] font-mono text-[#0f62fe] font-semibold">
                  Ficha Técnica Completa
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold text-xs">
                  BAT
                </div>
                <h4 className="text-xs font-bold text-[#09172f]">Baterias LFP</h4>
                <p className="text-[11px] text-slate-500 mt-1">Sistemas de armazenamento para backup residencial e C&amp;I.</p>
                <span className="mt-2 inline-block text-[10px] font-mono text-[#0f62fe] font-semibold">
                  Compatibilidade Garantida
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 font-bold text-xs">
                  SOL
                </div>
                <h4 className="text-xs font-bold text-[#09172f]">Painéis Solares N-Type</h4>
                <p className="text-[11px] text-slate-500 mt-1">Alta eficiência e garantias lineares de desempenho.</p>
                <span className="mt-2 inline-block text-[10px] font-mono text-[#0f62fe] font-semibold">
                  Homologação Inmetro
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
            <span>CADASTRO DE PRODUTOS SEM LIMITE ARTIFICIAL</span>
            <span className="text-[#0f62fe] font-bold">SOLICITAÇÃO DE ORÇAMENTO DIRETA</span>
          </div>
        </motion.div>

        {/* CARD 2: REPUTAÇÃO E AVALIAÇÕES AUDITADAS (1 coluna) */}
        <motion.div
          className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded uppercase tracking-wider">
                PROVA SOCIAL AUDITADA
              </span>
              <span className="font-mono text-xs font-bold text-[#146a4c] bg-[#e8f8f0] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
                INCLUSO
              </span>
            </div>

            <h3 className="text-xl font-black text-[#09172f]">Avaliações com Critérios Técnicos</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Clientes reais relatam suas experiências com avaliação por critérios objetivos de atendimento,
              técnica e prazo.
            </p>

            {/* Simulação de Notas e Estrelas */}
            <div className="mt-6 p-4 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#09172f]">Nota Média Geral</span>
                <span className="text-sm font-black font-mono text-[#f8ca3a] bg-[#09172f] px-2 py-0.5 rounded">
                  ★ 4.9 / 5.0
                </span>
              </div>

              <div className="space-y-1.5 pt-2 text-[11px] font-mono text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Qualidade Técnica</span>
                  <span className="font-bold text-[#09172f]">5.0</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-[#107c41] h-1.5 rounded-full w-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>Pontualidade &amp; Prazo</span>
                  <span className="font-bold text-[#09172f]">4.8</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-[#0f62fe] h-1.5 rounded-full w-[96%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
            Moderação humana ativa contra avaliações fraudulentas.
          </div>
        </motion.div>

        {/* CARD 3: CONTATO DIRETO E CONVERSÃO (1 coluna) */}
        <motion.div
          className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded uppercase tracking-wider">
                CONVERSÃO DIRETA
              </span>
              <span className="font-mono text-xs font-bold text-[#146a4c] bg-[#e8f8f0] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
                INCLUSO
              </span>
            </div>

            <h3 className="text-xl font-black text-[#09172f]">Sem Taxas Ocultas por Lead</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Os botões de contato abrem a conversa diretamente no WhatsApp da sua empresa ou discam para o seu
              telefone comercial.
            </p>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Zero comissão sobre vendas realizadas</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <Check className="w-4 h-4 text-[#0f62fe] shrink-0" />
                <span>Link direto para o seu site oficial</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <Check className="w-4 h-4 text-[#0f62fe] shrink-0" />
                <span>Formulário de solicitação de proposta exclusivo</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
            Relacionamento 100% transparente com o cliente.
          </div>
        </motion.div>

        {/* CARD 4: ANALYTICS EM TEMPO REAL COM COUNT-UP (1 coluna) */}
        <motion.div
          className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          custom={3}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-[#475569] bg-[#e2e8f0] px-2.5 py-1 rounded uppercase tracking-wider">
                MÉTRICAS &amp; DADOS
              </span>
              <span className="font-mono text-xs font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-1 rounded-full border border-[#fde68a]">
                MÓDULO CONFIGURÁVEL
              </span>
            </div>

            <h3 className="text-xl font-black text-[#09172f]">Painel Analítico de Acessos</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Monitore o interesse regional por suas soluções, visualizações de telefone e taxa de cliques em
              tempo real.
            </p>

            {/* Painel Count-up Estilo IBM Carbon */}
            <div className="mt-6 p-4 rounded-xl bg-[#09172f] text-white">
              <div className="flex items-center justify-between text-xs text-[#a6c8ff] font-mono">
                <span>VISUALIZAÇÕES NA BRAND PAGE</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black font-mono text-white mt-1 tabular-nums">
                {animatedCount.toLocaleString('pt-BR')}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#d0e2ff] font-mono border-t border-white/10 pt-2">
                <span>Cliques em WhatsApp: 142</span>
                <span className="text-emerald-400 font-bold">+28% mês</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
            Relatórios exportáveis em CSV e integração CRM.
          </div>
        </motion.div>

        {/* CARD 5: PERFIL PROTEGIDO CONTRA CONCORRENTES (1 coluna) */}
        <motion.div
          className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          custom={4}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-[#475569] bg-[#e2e8f0] px-2.5 py-1 rounded uppercase tracking-wider">
                BLINDAGEM DE MARCA
              </span>
              <span className="font-mono text-xs font-bold text-[#5b21b6] bg-[#f5f3ff] px-2.5 py-1 rounded-full border border-[#ddd6fe]">
                PLANO HABILITADO
              </span>
            </div>

            <h3 className="text-xl font-black text-[#09172f]">Bloqueio de Anúncios Competitivos</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Ao habilitar seu plano oficial, sua Brand Page fica protegida contra a exibição de banners ou links
              promocionais de terceiros.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                <span className="text-xs text-[#334155]">
                  Nenhuma outra empresa ou marca sugerida no seu perfil.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                <span className="text-xs text-[#334155]">
                  Atenção do consumidor 100% voltada à sua proposta comercial.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
            Exclusividade territorial e de canal contratada.
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
