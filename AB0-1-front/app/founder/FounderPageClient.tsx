'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, ArrowUpRight, ChevronDown, Linkedin, BookOpen } from 'lucide-react';
import FounderHeroMotion from '@/components/founder/FounderHeroMotion';
import { trackFounderPageView, trackFounderCtaClick } from '@/components/founder/FounderTelemetry';
import styles from './FounderEditorial.module.css';

// SSR is preserved for crawlable copy; animation code is split into independent chunks.
const FounderProcessDraw = dynamic(() => import('@/components/founder/FounderProcessDraw'));
const FounderSuccessJourneySection = dynamic(() => import('@/components/founder/FounderSuccessJourneySection'));
const FounderCursorTour = dynamic(() => import('@/components/founder/FounderCursorTour'));
const FounderBeforeAfter = dynamic(() => import('@/components/founder/FounderBeforeAfter'));
const FounderConversionTour = dynamic(() => import('@/components/founder/FounderConversionTour'));

const BOOKING_URL = 'https://zbooking.us/6shCH';
const LINKEDIN_URL = 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/';
const BLOG_URL = '/blog/plano-founder-avalia-solar';
const CONTACT_EMAIL = 'growth@avaliasolar.com.br';

const SECTION_LINKS = [
  { id: 'founder-processo', label: 'Como começar' },
  { id: 'founder-metodologia', label: 'Metodologia Founder' },
  { id: 'founder-tour', label: 'Tour da Brand Page' },
  { id: 'founder-comparador', label: 'Antes e depois' },
  { id: 'founder-conversao', label: 'Pontos de conversão' },
  { id: 'founder-equipe', label: 'Conheça o fundador' },
  { id: 'founder-faq', label: 'Perguntas frequentes' },
  { id: 'founder-agendar', label: 'Agendar apresentação' },
] as const;

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('founder-processo');
  const mobileIndexRef = useRef<HTMLDetailsElement>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    trackFounderPageView();
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = SECTION_LINKS.map(({ id }) => document.getElementById(id)).filter(
      (element): element is HTMLElement => Boolean(element)
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-12% 0px -64% 0px', threshold: 0 }
    );
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const handleBookingClick = (location: string) => {
    trackFounderCtaClick(`founder_${location}_booking`, BOOKING_URL);
  };
  const handleBlogClick = (location: string) => {
    trackFounderCtaClick(`founder_${location}_blog`, BLOG_URL);
  };

  const indexLinks = SECTION_LINKS.map(({ id, label }) => (
    <li key={id}>
      <a
        href={`#${id}`}
        data-active={activeSection === id}
        aria-current={activeSection === id ? 'location' : undefined}
        className={styles.asideLink}
        onClick={() => { if (mobileIndexRef.current) mobileIndexRef.current.open = false; }}
      >
        {label}
      </a>
    </li>
  ));

  return (
    <div className={styles.page}>
      <a href="#founder-conteudo" className={styles.skipLink}>Ir para o conteúdo do programa</a>
      <div className={styles.utilityBar}>
        <div className={styles.utilityInner}>
          <span className={styles.utilityLabel}>
            <span aria-hidden="true" className={styles.utilityDot} />
            AVALIA SOLAR · PROGRAMA FOUNDER 2026
          </span>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.utilityLink}
            onClick={() => handleBookingClick('topbar')}
          >
            Agendar apresentação
          </a>
        </div>
      </div>

      <FounderHeroMotion />

      <div className={styles.editorialShell}>
        <main id="founder-conteudo" className={styles.editorialContent}>
          <details className={styles.mobileIndex} ref={mobileIndexRef}>
            <summary>Explore as seções do Plano Founder</summary>
            <nav aria-label="Índice do Plano Founder"><ul className={styles.asideList}>{indexLinks}</ul></nav>
          </details>

          <div id="founder-processo" className={styles.sectionSlot}>
            <FounderProcessDraw />
          </div>
          <div id="founder-metodologia" className={styles.sectionSlot}>
            <FounderSuccessJourneySection />
          </div>
          <div id="founder-tour" className={styles.sectionSlot}>
            <FounderCursorTour />
          </div>
          <div id="founder-comparador" className={styles.sectionSlot}>
            <FounderBeforeAfter />
          </div>
          <div id="founder-conversao" className={styles.sectionSlot}>
            <FounderConversionTour />
          </div>
          <div className={styles.sectionSlot}>
        {/* SEÇÃO: CONVERSE COM O FUNDADOR FELIPE HENRIQUE MORAIS */}
        <section id="founder-equipe" aria-labelledby="founder-equipe-titulo" className="py-12 sm:py-16">
          <div className={styles.founderCard}>
            {/* Foto Oficial do Fundador */}
            <div className={styles.founderPortrait}>
              <Image
                src="/images/felipe-morais-fundador.jpg"
                alt="Felipe Henrique Morais - Fundador Avalia Solar"
                fill
                sizes="160px"
                className="object-cover object-top"
                loading="lazy"
              />
            </div>

            <div className={styles.founderCopy}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#0f62fe] bg-[#edf5ff] px-2.5 py-0.5 rounded">
                    LIDERANÇA &amp; INOVAÇÃO
                  </span>
                  <h3 id="founder-equipe-titulo" className="mt-2 text-2xl font-bold tracking-tight text-[#09172f] sm:text-3xl">
                    Felipe Henrique Morais
                  </h3>
                  <p className="text-sm font-bold text-[#0f62fe]">Fundador</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackFounderCtaClick('founder_card_linkedin', LINKEDIN_URL)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd5e1] hover:border-[#0077b5] text-xs font-bold text-[#334155] hover:text-[#0077b5] hover:bg-[#0077b5]/5 transition-all"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                &ldquo;Construímos o Avalia Solar com o propósito de transformar a reputação e o acesso comercial no
                setor de energia solar no Brasil. O Plano Founder é a nossa forma de abrir as portas e trabalhar
                lado a lado com as empresas que compartilham da nossa visão de qualidade e transparência.&rdquo;
              </p>

              <div className={styles.founderActions}>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleBookingClick('founder_card')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#f8ca3a] px-4 py-2.5 text-sm font-bold text-[#09172f] transition-colors hover:bg-[#fed957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f62fe]"
                >
                  <Calendar className="w-4 h-4 text-[#09172f]" />
                  <span>Agendar Conversa com o Fundador</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <Link
                  href={BLOG_URL}
                  onClick={() => handleBlogClick('founder_card')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#0f62fe]" />
                  <span>Ler Artigo Completo no Blog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>


          </div>
          <div className={styles.sectionSlot}>
        {/* SEÇÃO: FAQ (PERGUNTAS FREQUENTES) ESTILO IBM CARBON ACCORDION */}
        <section id="founder-faq" aria-labelledby="founder-faq-titulo" className="py-12 sm:py-16">
          <div className={styles.faqHeading}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
              Perguntas Frequentes
            </div>
            <h2 id="founder-faq-titulo" className="text-2xl font-bold tracking-tight text-[#09172f] sm:text-3xl">
              Esclareça todas as dúvidas sobre o programa
            </h2>
            <p className="mt-2 text-sm text-[#475569]">
              Compromisso ético e transparência jurídica para você tomar sua decisão com segurança.
            </p>
          </div>

          <div className={styles.faqList}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className={styles.faqItem}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className={styles.faqQuestion}
                    aria-expanded={isOpen}
                    aria-controls={`founder-faq-answer-${index}`}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#0f62fe] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div id={`founder-faq-answer-${index}`} className={styles.faqAnswer}>
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>


          </div>
          <div className={styles.sectionSlot}>
        {/* CALLOUT FINAL DE AGENDAMENTO (CARBON NAVY BLUE CTA) */}
        <section id="founder-agendar" aria-labelledby="founder-agendar-titulo" className="py-12 sm:py-16">
          <div className={styles.finalCallout}>
            <div className="relative z-10 max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0043ce]">
                OPORTUNIDADE DE LANÇAMENTO EXCLUSIVA
              </span>
              <h2 id="founder-agendar-titulo" className="mt-2 mb-3 text-2xl font-bold leading-tight tracking-tight text-[#09172f] sm:text-4xl">
                Construa a autoridade digital da sua empresa de energia solar desde agora.
              </h2>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[#475569] sm:text-base">
                Agende agora uma conversa de 20 minutos com nosso time comercial. Conheça as condições, reserve sua
                Brand Page e aproveite os dois meses gratuitos de homologação.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleBookingClick('callout_final')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#f8ca3a] px-5 py-3 text-sm font-bold text-[#09172f] transition-colors hover:bg-[#fed957]"
                >
                  <Calendar className="w-4 h-4 text-[#09172f]" />
                  <span>Agendar apresentação</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <Link
                  href={BLOG_URL}
                  onClick={() => handleBlogClick('callout_final')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#dde1e6] bg-white px-5 py-3 text-sm font-semibold text-[#09172f] transition-colors hover:bg-[#edf5ff]"
                >
                  <BookOpen className="h-4 w-4 text-[#0f62fe]" />
                  <span>Ver Artigo do Plano Founder no Blog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Interesse%20no%20Plano%20Founder`}
                  className="inline-flex min-h-11 items-center justify-center px-2 py-3 text-xs font-semibold text-[#0043ce] hover:underline"
                >
                  <span>Falar via E-mail ({CONTACT_EMAIL})</span>
                </a>
              </div>
            </div>
          </div>
        </section>


          </div>
        </main>
        <aside aria-label="Nesta página" className={styles.aside}>
          <p className={styles.asideHeading}>NESTA PÁGINA</p>
          <nav aria-label="Navegação pelas seções do Plano Founder">
            <ul className={styles.asideList}>{indexLinks}</ul>
          </nav>
        </aside>
      </div>
      {/* NOTA DE RODAPÉ JURÍDICA E DISCLAIMER */}
      <footer className={styles.footer}>
        <p className="max-w-4xl mx-auto leading-relaxed">
          *Oferta de 2 meses gratuitos válida conforme condições de adesão, elegibilidade e disponibilidade
          técnica durante o período de lançamento. A Avalia Solar não garante volume de vendas, orçamentos ou
          posicionamento orgânico fixo. Confirme o escopo detalhado na proposta comercial.
        </p>
        <div className={styles.footerLinks}>
          <Link href="/terms" className="hover:underline">
            Termos de Uso
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            Política de Privacidade
          </Link>
          <span>·</span>
          <Link href={BLOG_URL} className="hover:underline font-semibold">
            Artigo do Plano Founder
          </Link>
          <span>·</span>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleBookingClick('footer')}
            className="hover:underline font-bold"
          >
            Agendamento Oficial (zbooking.us/6shCH)
          </a>
        </div>
      </footer>

    </div>
  );
}
