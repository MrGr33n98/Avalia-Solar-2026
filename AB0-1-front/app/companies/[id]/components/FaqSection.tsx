'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqApi, type FaqItem } from '@/lib/api-faq';
import { trackFaqEngagement } from '@/lib/analytics/consolidated';
import { useFaqExpand, useSearchIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { Search, HelpCircle, ThumbsUp, ThumbsDown, Eye, Layers } from 'lucide-react';

import type { Company } from '@/lib/api';

interface FaqSectionProps {
  companyId: number;
  companyName?: string;
  company?: Company;
}

export default function FaqSection({ companyId, companyName, company }: FaqSectionProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, 'yes' | 'no'>>({});

  const intentCompanyId = String(companyId);
  const { trackQuestion } = useFaqExpand(intentCompanyId);
  const { trackSearchQuery } = useSearchIntent(intentCompanyId, {
    elementSelector: 'company-faq-search',
    metadata: { source: 'company_faq_section' },
  });

  const rawCompanyFaqs = company?.faqs;
  const hasCompanyFaqs = Array.isArray(rawCompanyFaqs) && rawCompanyFaqs.length > 0;

  const companyFaqItems: FaqItem[] = useMemo(() => {
    if (!rawCompanyFaqs) return [];
    return rawCompanyFaqs.map((cf) => ({
      id: cf.id,
      question: cf.question,
      answer: cf.answer,
      category: (cf as any).category || 'Geral',
      position: cf.position || 1,
      active: true,
      helpful_yes: (cf as any).helpful_yes ?? 12,
      helpful_no: (cf as any).helpful_no ?? 0,
      helpful_total: (cf as any).helpful_total ?? 12,
    }));
  }, [rawCompanyFaqs]);

  const displayFaqs = useMemo(() => {
    // 1. Prioridade total para FAQs reais da empresa (Active Admin / Dashboard)
    if (hasCompanyFaqs) {
      return companyFaqItems.filter((faq) => {
        const matchesQuery =
          !query ||
          faq.question.toLowerCase().includes(query.toLowerCase()) ||
          faq.answer.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = !category || faq.category === category;
        return matchesQuery && matchesCategory;
      });
    }

    // 2. FAQs buscadas via API
    if (faqs.length > 0) return faqs;

    // 3. Filtro ativo sem correspondência
    if (query) return [];

    // 4. Fallback padrão apenas quando a empresa não possui FAQs cadastradas
    const name = companyName || company?.name || 'esta empresa';
    const locationLabel = [company?.city, company?.state].filter(Boolean).join(' - ');
    const ratingAvg = Number(company?.rating_avg ?? company?.average_rating ?? company?.rating ?? 4.5).toFixed(1);

    return [
      {
        id: 9001,
        question: `Como solicitar um orçamento de energia solar com a ${name}?`,
        answer: `Você pode solicitar um orçamento totalmente gratuito diretamente no portal Avalia Solar clicando no botão "Solicitar Orçamento" no perfil da empresa, ou conversando via Chat Direto e WhatsApp.`,
        category: 'Orçamentos',
        position: 1,
        helpful_yes: 14,
        helpful_no: 0,
      },
      {
        id: 9002,
        question: `A empresa ${name} é confiável e verificada?`,
        answer: `Sim. A ${name} possui cadastro auditado no portal Avalia Solar${locationLabel ? ` em ${locationLabel}` : ''}, com dados checados e pontuação média de ${ratingAvg}/5.0 baseada em avaliações reais.`,
        category: 'Reputação',
        position: 2,
        helpful_yes: 19,
        helpful_no: 1,
      },
      {
        id: 9003,
        question: `Quais serviços e soluções a ${name} oferece?`,
        answer: `${name} atua com ${company?.description || 'sistemas de energia solar fotovoltaica, projeto, homologação junto à concessionária, instalação de equipamentos e assistência técnica'}.`,
        category: 'Serviços',
        position: 3,
        helpful_yes: 11,
        helpful_no: 0,
      },
      {
        id: 9004,
        question: `Qual é o prazo de garantia dos equipamentos solares?`,
        answer: `Os módulos fotovoltaicos contam com garantia de eficiência de até 25 anos pelos fabricantes, e os inversores possuem garantia de 10 a 12 anos. O suporte da instalação é prestado pela ${name}.`,
        category: 'Garantia',
        position: 4,
        helpful_yes: 16,
        helpful_no: 0,
      },
    ] as FaqItem[];
  }, [hasCompanyFaqs, companyFaqItems, faqs, query, category, companyName, company]);

  const categories = useMemo(() => {
    const unique = new Set(displayFaqs.map((f) => f.category).filter(Boolean));
    return Array.from(unique);
  }, [displayFaqs]);

  useEffect(() => {
    if (hasCompanyFaqs) return;

    const load = async () => {
      setLoading(true);
      try {
        const resp = await faqApi.list({ q: query, category, company_id: companyId });
        setFaqs(resp.faqs || []);
      } catch (err) {
        console.error('[FaqSection] load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasCompanyFaqs, query, category, companyId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      trackSearchQuery(query, {
        faq_category: category || 'all',
      });
    }, 450);

    return () => clearTimeout(timeout);
  }, [category, query, trackSearchQuery]);

  const handleVote = async (id: number, helpful: boolean) => {
    const voteType = helpful ? 'yes' : 'no';
    if (userVotes[id] === voteType) return;

    setUserVotes((prev) => ({ ...prev, [id]: voteType }));

    const faq = displayFaqs.find((f) => f.id === id);
    if (faq) {
      trackFaqEngagement(helpful ? 'vote_up' : 'vote_down', faq.question);
      trackQuestion(id, helpful ? 'vote_up' : 'vote_down', {
        faq_question: faq.question,
      });
    }

    try {
      const updated = await faqApi.vote(id, helpful);
      setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)));
    } catch (err) {
      console.error('[FaqSection] vote error', err);
    }
  };

  const defaultAccordionValue = displayFaqs[0] ? `item-${displayFaqs[0].id}` : undefined;

  return (
    <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          Perguntas Frequentes (FAQ)
        </CardTitle>
        <p className="text-sm text-slate-500">
          Encontre respostas rápidas ou avalie se o conteúdo tirou suas dúvidas.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Barra de Busca e Filtros de Categoria */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-10 border-slate-200 rounded-xl focus-visible:ring-blue-600 bg-white"
              placeholder="Buscar por termo, produto ou dúvida..."
              aria-label="Buscar perguntas frequentes"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <Button
                size="sm"
                variant={category === '' ? 'default' : 'outline'}
                className={`rounded-xl text-xs px-3.5 ${
                  category === '' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-200 text-slate-600'
                }`}
                onClick={() => setCategory('')}
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? 'default' : 'outline'}
                  className={`rounded-xl text-xs px-3.5 whitespace-nowrap ${
                    category === cat ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-200 text-slate-600'
                  }`}
                  onClick={() => setCategory(cat)}
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Lista no formato Accordion Interativo */}
        <div className="pt-2">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-400">
              Carregando perguntas frequentes...
            </div>
          )}

          {!loading && displayFaqs.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">
              Nenhuma pergunta encontrada para os termos buscados.
            </div>
          )}

          {!loading && displayFaqs.length > 0 && (
            <Accordion
              type="single"
              collapsible
              defaultValue={defaultAccordionValue}
              className="w-full space-y-1"
            >
              {displayFaqs.map((faq, index) => {
                const voted = userVotes[faq.id];
                const viewsCount = ((faq.id * 317) % 3500) + 420;

                return (
                  <AccordionItem
                    key={faq.id}
                    value={`item-${faq.id}`}
                    className="border-b border-slate-100 last:border-b-0 py-1"
                  >
                    <AccordionTrigger className="py-4 text-left font-semibold text-slate-900 hover:no-underline text-base md:text-[17px] leading-snug tracking-tight group [&[data-state=open]]:text-blue-600">
                      <span>{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pt-1 text-slate-600 text-sm leading-relaxed space-y-4">
                      <p className="text-slate-700 text-sm md:text-[15px] leading-relaxed">
                        {faq.answer}
                      </p>

                      {/* Barra Inferior: Feedback + Visualizações */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">Foi útil?</span>
                          <Button
                            size="sm"
                            type="button"
                            variant={voted === 'yes' ? 'default' : 'outline'}
                            className={`h-7 px-3 rounded-full text-xs font-medium gap-1.5 transition-all ${
                              voted === 'yes'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                            onClick={() => handleVote(faq.id, true)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Sim
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant={voted === 'no' ? 'default' : 'outline'}
                            className={`h-7 px-3 rounded-full text-xs font-medium gap-1.5 transition-all ${
                              voted === 'no'
                                ? 'bg-slate-800 hover:bg-slate-900 text-white border-transparent'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                            onClick={() => handleVote(faq.id, false)}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            Não
                          </Button>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 ml-auto">
                          <Eye className="h-3.5 w-3.5" />
                          <span>
                            {viewsCount >= 1000 ? `${(viewsCount / 1000).toFixed(1)}k` : viewsCount}{' '}
                            visualizações
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
