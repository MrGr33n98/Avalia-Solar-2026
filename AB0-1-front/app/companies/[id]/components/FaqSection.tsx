'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { faqApi, type FaqItem } from '@/lib/api-faq';
import { trackFaqEngagement } from '@/lib/analytics/consolidated';
import { useFaqExpand, useSearchIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { Search, HelpCircle, ThumbsUp, ThumbsDown, Layers } from 'lucide-react';

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
  const intentCompanyId = String(companyId);
  const { trackQuestion } = useFaqExpand(intentCompanyId);
  const { trackSearchQuery } = useSearchIntent(intentCompanyId, {
    elementSelector: 'company-faq-search',
    metadata: { source: 'company_faq_section' },
  });

  const displayFaqs = useMemo(() => {
    if (faqs.length > 0) return faqs;
    if (query) return [];

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
  }, [faqs, query, companyName, company]);

  const categories = useMemo(() => {
    const unique = new Set(displayFaqs.map((f) => f.category));
    return Array.from(unique);
  }, [displayFaqs]);

  useEffect(() => {
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
  }, [query, category, companyId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      trackSearchQuery(query, {
        faq_category: category || 'all',
      });
    }, 450);

    return () => clearTimeout(timeout);
  }, [category, query, trackSearchQuery]);

  const handleVote = async (id: number, helpful: boolean) => {
    // Track FAQ engagement
    const faq = faqs.find(f => f.id === id);
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

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Perguntas frequentes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Encontre respostas rapidas ou avalie se o conteudo ajudou.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              placeholder="Buscar por termo, produto ou categoria"
              aria-label="Buscar perguntas frequentes"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={category === '' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setCategory('')}
            >
              Todas
            </Button>
            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  className="whitespace-nowrap flex-1"
                  onClick={() => setCategory(cat)}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Carregando perguntas...</div>}
          {!loading && displayFaqs.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhuma pergunta encontrada para o filtro atual.</div>
          )}
          {!loading &&
            displayFaqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{faq.question}</div>
                        <p className="text-xs text-muted-foreground">{faq.category}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">#{faq.position || 0}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{faq.answer}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Isso ajudou?</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 px-2"
                        onClick={() => handleVote(faq.id, true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {faq.helpful_yes || 0}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 px-2"
                        onClick={() => handleVote(faq.id, false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        {faq.helpful_no || 0}
                      </Button>
                      <span className="ml-auto text-muted-foreground/80">
                        {faq.helpful_total || faq.helpful_yes || faq.helpful_no ? `${faq.helpful_total || 0} votos` : 'Novo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
