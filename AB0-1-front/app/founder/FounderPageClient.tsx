'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronDown,
  Layers,
  Star,
  MessageSquare,
  BarChart3,
  PhoneCall,
  Sparkles,
  HelpCircle,
  EyeOff,
  Laptop,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const CONTACT_EMAIL = 'growth@avaliasolar.com.br';

interface TourStep {
  id: string;
  count: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  desc: string;
  where: string;
  highlightText: string;
  focus: [number, number, number, number] | null; // [left, top, width, height] em porcentagem
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'identity',
    count: '01 / 07',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    title: 'Identidade e Brand Page Empresarial',
    tag: 'Base da Plataforma',
    desc: 'Seu perfil institucional destaca logotipo, histórico de mercado, especialidades técnicas, capacidade de atendimento e regiões em um endereço exclusivo e compartilhável.',
    where: 'Topo da página empresarial · Banner oficial e cabeçalho verificado',
    highlightText: 'Apresentação corporativa de alto impacto para clientes e parceiros',
    focus: [20, 10, 60, 17],
  },
  {
    id: 'products',
    count: '02 / 07',
    icon: <Layers className="w-5 h-5 text-blue-500" />,
    title: 'Catálogo de Produtos e Soluções',
    tag: 'Base + Módulos Pro',
    desc: 'Exiba inversores, módulos fotovoltaicos, sistemas de armazenamento por baterias e serviços de engenharia. Cada item possui ficha técnica e canal de solicitação direta.',
    where: 'Bloco central · Grade e carrossel de produtos homologados',
    highlightText: 'Exposição técnica com foco em conversão e especificações reais',
    focus: [18, 43, 43, 14],
  },
  {
    id: 'reviews',
    count: '03 / 07',
    icon: <Star className="w-5 h-5 text-amber-400" />,
    title: 'Reputação e Avaliações de Clientes Reais',
    tag: 'Base da Plataforma',
    desc: 'Depoimentos auditados com notas por critérios (qualidade técnica, pontualidade, atendimento e suporte). Prova social genuína que combate a desconfiança do mercado.',
    where: 'Seção pública de avaliações · Indicador de pontuação e critérios',
    highlightText: 'Transparência auditada para diferenciar sua empresa dos concorrentes',
    focus: [18, 57, 43, 17],
  },
  {
    id: 'contacts',
    count: '04 / 07',
    icon: <PhoneCall className="w-5 h-5 text-emerald-500" />,
    title: 'Canais de Contato e Conversão Direta',
    tag: 'Recurso Configurável',
    desc: 'Telefone comercial, WhatsApp corporativo, site institucional e botão de solicitação de proposta conectam o cliente imediatamente aos seus consultores.',
    where: 'Coluna lateral de contato e cabeçalho de conversão',
    highlightText: 'Sem intermediários, sem cobrança de taxas por lead e sem comissão',
    focus: [62, 29, 19, 14],
  },
  {
    id: 'exclusive',
    count: '05 / 07',
    icon: <EyeOff className="w-5 h-5 text-indigo-500" />,
    title: 'Perfil Protegido sem Anúncios Concorrentes',
    tag: 'Requer Plano Habilitado',
    desc: 'Para perfis pagos elegíveis, o sistema oculta banners e recomendações de competidores no espaço da sua empresa, mantendo o comprador 100% focado na sua marca.',
    where: 'Painel lateral e áreas dedicadas a links de terceiros',
    highlightText: 'Retenção absoluta do lead durante a visita na sua Brand Page',
    focus: [62, 43, 20, 13],
  },
  {
    id: 'projects',
    count: '06 / 07',
    icon: <MessageSquare className="w-5 h-5 text-cyan-500" />,
    title: 'Portfólio de Obras e FAQ Técnica',
    tag: 'Módulos Pro Configuráveis',
    desc: 'Apresente fotos de usinas instaladas, cases de sucesso e responda antecipadamente às dúvidas frequentes dos consumidores para acelerar a tomada de decisão.',
    where: 'Abas de conteúdo e módulo lateral de perguntas e respostas',
    highlightText: 'Elimina as principais objeções de compra antes da primeira conversa',
    focus: [62, 57, 20, 13],
  },
  {
    id: 'analytics',
    count: '07 / 07',
    icon: <BarChart3 className="w-5 h-5 text-violet-500" />,
    title: 'Inteligência e Métricas de Interação',
    tag: 'Módulo Pro Configurável',
    desc: 'Acompanhe visualizações do perfil, cliques nos contatos, engajamento por região e origens de tráfego através de relatórios técnicos de desempenho.',
    where: 'Dashboard privado da empresa · Acesso restrito via login',
    highlightText: 'Decisões baseadas em dados sobre a demanda na sua praça de atuação',
    focus: null,
  },
];

const FAQS = [
  {
    q: 'O que é exatamente o Plano Founder da Avalia Solar?',
    a: 'O Plano Founder é um programa comercial exclusivo de lançamento voltado aos primeiros parceiros pioneiros da Avalia Solar. Ele combina o benefício de dois meses gratuitos com a estruturação de uma Brand Page profissional, presença no diretório empresarial e acesso a recursos de reputação.',
  },
  {
    q: 'O que está incluído nos 2 meses gratuitos de lançamento?',
    a: 'Nos dois meses iniciais, a empresa tem acesso sem custo de mensalidade aos recursos previstos no seu pacote de homologação, como perfil empresarial verificado, catálogo de produtos e serviços, canais de contato direto e recebimento de avaliações de clientes.',
  },
  {
    q: 'O Founder inclui a retirada de anúncios de concorrentes?',
    a: 'Sim, a arquitetura dos planos pagos contempla a proteção do perfil com a ocultação de anúncios e links de empresas concorrentes na página da sua marca. A regra entra em vigor mediante a habilitação do plano contratado.',
  },
  {
    q: 'O programa garante volume de vendas ou orçamentos?',
    a: 'Não. A Avalia Solar não vende contatos nem promete metas financeiras ou volumes artificiais de orçamentos. O objetivo é fornecer a infraestrutura de credibilidade, posicionamento e prova social para que compradores qualificados encontrem e escolham sua empresa.',
  },
  {
    q: 'Minha empresa terá prioridade no ranking orgânico de avaliações?',
    a: 'Não. O ranking de reputação do portal segue metodologia técnica e isonômica com base em avaliações autênticas de consumidores reais. Recursos de patrocínio ou destaque publicitário, quando contratados, são devidamente sinalizados como patrocinados.',
  },
  {
    q: 'Posso solicitar avaliações dos meus clientes atuais?',
    a: 'Sim, e recomendamos fortemente. Você pode disponibilizar o link direto do seu perfil verificado para que clientes reais relatem sua experiência de forma espontânea. Avaliações com notas detalhadas aumentam expressivamente o TrustScore da empresa.',
  },
  {
    q: 'A página da minha empresa será indexada pelo Google?',
    a: 'Nossa plataforma é construída sobre arquitetura Next.js com SEO, schema.org e dados estruturados modernos para acelerar a indexação. A presença de catálogo detalhado e avaliações contribui diretamente para a descoberta nos buscadores.',
  },
  {
    q: 'Posso cadastrar filiais ou unidades regionais?',
    a: 'Sim. Durante a apresentação do programa, nossa equipe avalia a estrutura da sua empresa (matriz e filiais) e configura o modelo ideal de perfil para atender suas praças.',
  },
  {
    q: 'Ser "Founder" concede participação societária na Avalia Solar?',
    a: 'Não. "Founder" é a denominação estritamente comercial do programa de entrada para os primeiros membros da plataforma. Não confere cotas, direitos societários ou vínculos corporativos.',
  },
  {
    q: 'Como funciona a renovação após os 2 meses gratuitos?',
    a: 'Antes da conclusão dos 60 dias de gratuidade, apresentamos o balanço de métricas da sua página. A continuidade no plano pago ocorre apenas mediante sua confirmação expressa e escolha do pacote comercial mais adequado.',
  },
  {
    q: 'Quais documentos ou dados preciso enviar para ativação?',
    a: 'Basta agendar a reunião de alinhamento. Solicitaremos o CNPJ ativo da empresa, logotipo em alta resolução, fotos dos produtos ou catálogo em PDF e os contatos comerciais que devem constar na página.',
  },
  {
    q: 'Como realizo o agendamento da minha apresentação?',
    a: 'Você pode escolher o dia e horário que melhor se adaptem à sua agenda diretamente pelo link oficial de agendamento: https://zbooking.us/6shCH. A sessão dura cerca de 20 minutos.',
  },
];

export default function FounderPageClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const tourRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % TOUR_STEPS.length);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1 + TOUR_STEPS.length) % TOUR_STEPS.length);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Navegação por teclado quando o usuário usa setas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
        setIsKeyboardActive(true);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
        setIsKeyboardActive(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-[#f4f7fb] text-[#161616] antialiased selection:bg-[#0f62fe] selection:text-white">
      {/* BARRA SUPERIOR TÉCNICA IBM CARBON */}
      <div className="border-b border-[#d0d7de] bg-[#09172f] text-white py-2 px-4 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f8ca3a] animate-pulse" />
            <span className="tracking-wider text-[#d0e2ff] font-semibold">
              AVALIA SOLAR · PROGRAMA EXCLUSIVO FOUNDER 2026
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#8a99b5]">
            <span>HOMOLOGAÇÃO B2B</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline text-white font-medium">CONDIÇÃO DE 60 DIAS SEM MENSALIDADE</span>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f8ca3a] hover:underline flex items-center gap-1 font-bold"
            >
              Agendar Apresentação <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* HERO SECTION - IBM ENTERPRISE DESIGN */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#09172f] via-[#0f2c5d] to-[#164387] text-white pt-16 pb-24 border-b border-[#0f346b]">
        {/* Malha de fundo arquitetural sutil */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Coluna Texto (7 colunas) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-mono text-[#f8ca3a] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f8ca3a]" />
                Brand Page Oficial & Programa de Lançamento
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white">
                Plano Founder Avalia Solar:{' '}
                <span className="text-white underline decoration-[#f8ca3a] decoration-4 underline-offset-8">
                  construa sua presença
                </span>{' '}
                desde o início.
              </h1>

              <p className="text-base sm:text-lg text-[#d0e2ff] leading-relaxed max-w-2xl font-normal">
                Posicione sua marca em um diretório empresarial auditado. Reúna catálogo de produtos,
                avaliações reais de clientes e canais de contato direto — com condição especial de 2 meses
                gratuitos para as empresas que inauguram a plataforma.
              </p>

              {/* Botões de Ação Principais */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded bg-[#f8ca3a] text-[#09172f] font-bold text-sm tracking-wide shadow-xl hover:bg-[#fed957] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Calendar className="w-4 h-4 text-[#09172f]" />
                  <span>Agendar Apresentação Executiva</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <a
                  href="#tour-interativo"
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
                >
                  <Laptop className="w-4 h-4 text-[#f8ca3a]" />
                  <span>Explorar Tour da Tela</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Métricas e Garantias em Formato Carbon */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/15 text-xs font-mono text-[#a6c8ff]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f8ca3a] shrink-0" />
                  <span>2 MESES GRÁTIS NO LANÇAMENTO*</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f8ca3a] shrink-0" />
                  <span>ENERGIA SOLAR &amp; MOBILIDADE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f8ca3a] shrink-0" />
                  <span>ADESÃO COM ESCOPO CLARO</span>
                </div>
              </div>
            </div>

            {/* Coluna Visual Laptop Teaser (5 colunas) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Badge Flutuante no Laptop */}
                <div className="absolute -top-4 -left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-[#09172f] text-xs font-bold shadow-2xl border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#107c41]" />
                  <span>Página Empresarial GoodWe Brasil</span>
                </div>

                <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/20 to-transparent border border-white/20 shadow-2xl backdrop-blur-md">
                  <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3] w-full">
                    <Image
                      src="/assets/founder-laptop.jpg"
                      alt="Notebook exibindo a página corporativa da GoodWe Brasil no Avalia Solar"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 500px"
                      className="object-contain"
                    />
                  </div>
                </div>

                <p className="mt-3 text-center text-xs text-[#8cb4f5] font-mono">
                  Visualização da Brand Page em tela widescreen de computador
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PRINCIPAL: SHOWCASE INTERATIVO DO LAPTOP (A+++ EXPERIENCE) */}
      <section id="tour-interativo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" ref={tourRef}>
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-3">
            <Laptop className="w-3.5 h-3.5" />
            Navegador Interativo da Brand Page
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#09172f] tracking-tight">
            Explore cada funcionalidade na tela real do notebook
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
            Clique nos botões de navegação ou nos indicadores para percorrer as áreas da Brand Page oficial.
            Veja exatamente como sua empresa será exibida para milhares de integradores e clientes.
          </p>
        </div>

        {/* CONTAINER DO TOUR ESTILO IBM CARBON A+++ */}
        <div className="rounded-2xl border border-[#d0d7de] bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LADO ESQUERDO: VIEWPORT DO NOTEBOOK (7 colunas) */}
          <div className="lg:col-span-7 bg-[#0b1934] p-4 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Grid background sutil no container do viewport */}
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative w-full max-w-[680px] aspect-[4/3] rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-black">
              {/* Imagem base do Laptop */}
              <Image
                src="/assets/founder-laptop.jpg"
                alt="Notebook com a Brand Page no Avalia Solar"
                fill
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-contain"
              />

              {/* OVERLAY DE FOCO DINÂMICO (destaque pulsante sobre o elemento) */}
              {step.focus && (
                <div
                  className="absolute transition-all duration-300 ease-out pointer-events-none rounded-md"
                  style={{
                    left: `${step.focus[0]}%`,
                    top: `${step.focus[1]}%`,
                    width: `${step.focus[2]}%`,
                    height: `${step.focus[3]}%`,
                    border: '3px solid #ffd43b',
                    boxShadow: '0 0 0 9999px rgba(9, 23, 47, 0.40), 0 0 24px rgba(255, 212, 59, 0.85)',
                  }}
                >
                  <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#f8ca3a] text-[#09172f] font-mono font-black text-xs flex items-center justify-center shadow-lg animate-bounce">
                    {currentStep + 1}
                  </div>
                </div>
              )}

              {/* Caso o foco seja o dashboard privado (recurso 7) */}
              {!step.focus && (
                <div className="absolute inset-0 bg-[#09172f]/85 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-[#0f62fe] text-white flex items-center justify-center mb-3 shadow-xl">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#f8ca3a] font-bold">
                    Módulo de Inteligência Privada
                  </span>
                  <h4 className="text-xl font-bold mt-1">Dashboard Analítico da Empresa</h4>
                  <p className="text-xs text-[#d0e2ff] max-w-sm mt-2 leading-relaxed">
                    Visualização restrita ao administrador da empresa, com relatórios de acessos, visualizações
                    de telefone, cliques em WhatsApp e métricas de conversão.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between w-full max-w-[680px] text-[11px] font-mono text-[#8a99b5]">
              <span>TELA: MACBOOK PRO 16&quot; · MOCKUP REAL GOODWE BRASIL</span>
              <span>PASSO {currentStep + 1} DE {TOUR_STEPS.length}</span>
            </div>
          </div>

          {/* LADO DIREITO: PAINEL DE CONTROLE E EXPLICAÇÃO (5 colunas) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-[#d0d7de]">
            <div>
              {/* Header do Painel */}
              <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
                <span className="font-mono text-xs font-bold tracking-wider text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded">
                  ETAPA {step.count}
                </span>
                <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#e8f8f0] text-[#146a4c] border border-[#bbf7d0]">
                  {step.tag}
                </span>
              </div>

              {/* Ícone e Título */}
              <div className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center mb-4">
                  {step.icon}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[#09172f] tracking-tight leading-snug">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm text-[#475569] leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Localização na tela (Onde fica) */}
              <div className="mt-6 p-3.5 rounded-lg bg-[#f8fafc] border-l-4 border-[#f8ca3a] border border-[#e2e8f0]">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#09172f] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-[#09172f] font-mono uppercase tracking-wide">
                      Localização na interface:
                    </span>
                    <span className="text-xs text-[#334155] leading-normal">{step.where}</span>
                  </div>
                </div>
              </div>

              {/* Pílula de destaque de valor comercial */}
              <div className="mt-3 text-xs text-[#0f62fe] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{step.highlightText}</span>
              </div>
            </div>

            {/* Controles de Navegação do Tour */}
            <div className="pt-8 border-t border-[#e5e7eb] mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-12 h-12 rounded-lg border border-[#cbd5e1] hover:bg-[#f1f5f9] active:bg-[#e2e8f0] text-[#09172f] flex items-center justify-center font-bold transition-colors"
                  aria-label="Passo anterior do tour"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 rounded-lg bg-[#0f62fe] hover:bg-[#0043ce] active:bg-[#002d9c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <span>{currentStep === TOUR_STEPS.length - 1 ? 'Reiniciar Tour' : 'Próximo Recurso'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dots Indicadores de Etapa */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {TOUR_STEPS.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentStep ? 'w-8 bg-[#0f62fe]' : 'w-2 bg-[#cbd5e1] hover:bg-[#94a3b8]'
                      }`}
                      aria-label={`Ir para passo ${idx + 1}: ${s.title}`}
                    />
                  ))}
                </div>

                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#0f62fe] hover:underline flex items-center gap-1"
                >
                  Agendar Apresentação <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: TABELA E GRADES DO ESCOPO CONFIRMADO (IBM CARBON STRUCTURE) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#d0d7de]">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
            Estrutura da Proposta
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#09172f] tracking-tight">
            Transparência absoluta: o que está garantido e o que é configurável
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#475569]">
            Apresentamos com clareza a separação entre a base confirmada do programa de lançamento e os
            módulos opcionais ou sob demanda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Confirmado no Plano Founder */}
          <div className="rounded-2xl border-2 border-[#09172f] bg-white p-6 sm:p-8 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded">
                  PACOTE CONFIRMADO
                </span>
                <span className="text-xs font-mono font-bold text-[#146a4c] bg-[#e8f8f0] px-2.5 py-1 rounded-full">
                  2 MESES GRATUITOS
                </span>
              </div>

              <h3 className="text-xl font-black text-[#09172f]">Brand Page &amp; Diretório Oficial</h3>
              <p className="mt-2 text-sm text-[#475569]">
                Infraestrutura completa para sua marca se consolidar como referência no setor solar:
              </p>

              <ul className="mt-6 space-y-3.5 text-sm text-[#334155]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                  <span>
                    <strong>Perfil institucional verificado:</strong> banner corporativo, história da empresa,
                    logotipo e endereço oficial.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                  <span>
                    <strong>Catálogo inicial de produtos e serviços:</strong> vitrine técnica de inversores,
                    módulos e soluções.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                  <span>
                    <strong>Canal de contato direto:</strong> telefone, WhatsApp corporativo e link para seu
                    site oficial sem cobrança de taxas por lead.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                  <span>
                    <strong>Mural de avaliações autênticas:</strong> convite a clientes reais para relato de
                    experiências e nota de reputação.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e2e8f0]">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-lg bg-[#09172f] hover:bg-[#16294a] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Garantir Condição Founder</span>
                <ArrowUpRight className="w-4 h-4 text-[#f8ca3a]" />
              </a>
            </div>
          </div>

          {/* Card 2: Módulos Opcionais / Pro / Enterprise */}
          <div className="rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#475569] bg-[#e2e8f0] px-2.5 py-1 rounded">
                  CONFIGURÁVEIS SOB DEMANDA
                </span>
                <span className="text-xs font-mono font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-1 rounded-full">
                  MÓDULOS AVANÇADOS
                </span>
              </div>

              <h3 className="text-xl font-black text-[#09172f]">Recursos Pro &amp; Expansão Comercial</h3>
              <p className="mt-2 text-sm text-[#475569]">
                Funcionalidades adicionais ativadas conforme as necessidades de escala e estratégia da sua equipe:
              </p>

              <ul className="mt-6 space-y-3.5 text-sm text-[#334155]">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f62fe] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    +
                  </span>
                  <span>
                    <strong>Ocultação de anúncios de concorrentes:</strong> proteção exclusiva do espaço de marca
                    na sua Brand Page.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f62fe] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    +
                  </span>
                  <span>
                    <strong>Campanhas patrocinadas de destaque:</strong> posicionamento no topo de categorias e
                    buscas regionais.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f62fe] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    +
                  </span>
                  <span>
                    <strong>Galeria expandida de obras e vídeos:</strong> vitrine rica de multimídia e cases
                    comerciais.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f62fe] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    +
                  </span>
                  <span>
                    <strong>Analytics detalhado com exportação:</strong> relatórios avançados de tráfego, cliques
                    e conversão.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#cbd5e1] text-xs text-[#64748b]">
              *Estes itens são esclarecidos na reunião de apresentação executiva e contratados apenas se fizerem
              sentido para a sua estratégia.
            </div>
          </div>
        </div>

        {/* 3 ETAPAS DE ADESÃO */}
        <div className="mt-16 pt-16 border-t border-[#d0d7de]">
          <h3 className="text-xl font-black text-[#09172f] mb-8 text-center">
            Como funciona o processo de ativação do Plano Founder
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white border border-[#d0d7de] shadow-sm">
              <span className="font-mono text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded">
                ETAPA 01
              </span>
              <h4 className="text-base font-bold text-[#09172f] mt-4 mb-2">Apresentação &amp; Diagnóstico</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Reunião de 20 minutos via Google Meet ou chamada de vídeo para entender suas prioridades e
                esclarecer o escopo.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-[#d0d7de] shadow-sm">
              <span className="font-mono text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded">
                ETAPA 02
              </span>
              <h4 className="text-base font-bold text-[#09172f] mt-4 mb-2">Montagem da Brand Page</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Nossa equipe de curadoria auxilia no cadastro do catálogo, imagens oficiais e dados de contato
                para publicação.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-[#d0d7de] shadow-sm">
              <span className="font-mono text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded">
                ETAPA 03
              </span>
              <h4 className="text-base font-bold text-[#09172f] mt-4 mb-2">2 Meses Gratuitos &amp; Métricas</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Sua empresa aproveita os 60 dias de exposição. No encerramento, apresentamos os resultados para
                você decidir se renova.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: FAQ (PERGUNTAS FREQUENTES) ESTILO IBM CARBON ACCORDION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#d0d7de]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
            Perguntas Frequentes
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#09172f] tracking-tight">
            Esclareça todas as dúvidas sobre o programa
          </h2>
          <p className="mt-2 text-sm text-[#475569]">
            Compromisso ético e transparência jurídica para você tomar sua decisão com segurança.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-[#d0d7de] bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#09172f] hover:bg-[#f8fafc] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#0f62fe] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#475569] leading-relaxed border-t border-[#f1f5f9]">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CALLOUT FINAL DE AGENDAMENTO (CARBON NAVY BLUE CTA) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#09172f] via-[#0f2c5d] to-[#164387] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-white/20">
          <div className="relative z-10 max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-[#f8ca3a] font-bold">
              OPORTUNIDADE DE LANÇAMENTO EXCLUSIVA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-2 mb-4 leading-tight">
              Construa a autoridade digital da sua empresa de energia solar desde agora.
            </h2>
            <p className="text-sm sm:text-base text-[#d0e2ff] leading-relaxed mb-8 max-w-2xl">
              Agende agora uma conversa de 20 minutos com nosso time comercial. Conheça as condições, reserve sua
              Brand Page e aproveite os dois meses gratuitos de homologação.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#f8ca3a] text-[#09172f] font-black text-sm tracking-wide shadow-xl hover:bg-[#fed957] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="w-4 h-4 text-[#09172f]" />
                <span>Agendar Apresentação em zbooking.us/6shCH</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Interesse%20no%20Plano%20Founder`}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                <span>Falar via E-mail</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* NOTA DE RODAPÉ JURÍDICA E DISCLAIMER */}
      <footer className="py-8 px-4 text-center text-xs text-[#64748b] border-t border-[#d0d7de] max-w-7xl mx-auto font-mono">
        <p className="max-w-4xl mx-auto leading-relaxed">
          *Oferta de 2 meses gratuitos válida conforme condições de adesão, elegibilidade e disponibilidade
          técnica durante o período de lançamento. A Avalia Solar não garante volume de vendas, orçamentos ou
          posicionamento orgânico fixo. Confirme o escopo detalhado na proposta comercial.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[#0f62fe]">
          <Link href="/terms" className="hover:underline">
            Termos de Uso
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            Política de Privacidade
          </Link>
          <span>·</span>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">
            Agendamento Oficial (zbooking.us/6shCH)
          </a>
        </div>
      </footer>
    </div>
  );
}

