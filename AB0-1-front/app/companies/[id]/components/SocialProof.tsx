'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, ShieldCheck, Sparkles, Star, ArrowRight, ArrowLeft } from 'lucide-react';

interface SocialProofProps {
  companyName: string;
}

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Cliente residencial',
    quote: 'Instalacao limpa, prazo em dia e economia imediata na conta.',
    rating: 5,
  },
  {
    name: 'Rodrigo Lima',
    role: 'Diretor de operacoes',
    quote: 'Time rapido no atendimento e relatorios claros de performance.',
    rating: 5,
  },
  {
    name: 'Juliana Campos',
    role: 'Compras B2B',
    quote: 'Facilidade para comparar propostas e suporte consultivo de ponta.',
    rating: 4,
  },
];

const trustBadges = [
  { label: 'Suporte verificado', icon: ShieldCheck },
  { label: 'Instalacoes auditadas', icon: Sparkles },
  { label: 'Garantia de prazo', icon: Star },
];

const successCases = [
  { title: 'Rede varejo', metric: '25%+ economia', detail: '17 lojas com monitoramento ativo' },
  { title: 'Condominio SP', metric: '18% payback mais rapido', detail: 'Projeto solar e gestao de consumo' },
  { title: 'Fabrica MG', metric: '12% menos paradas', detail: 'Retaguarda tecnica 24/7' },
];

export default function SocialProof({ companyName }: SocialProofProps) {
  const [caseIndex, setCaseIndex] = useState(0);
  const activeCase = useMemo(() => successCases[caseIndex % successCases.length], [caseIndex]);

  const next = () => setCaseIndex((i) => (i + 1) % successCases.length);
  const prev = () => setCaseIndex((i) => (i - 1 + successCases.length) % successCases.length);

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Quote className="h-5 w-5 text-primary" />
          Provas sociais
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Resultados e depoimentos que reforcam a confianca na {companyName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
            <div className="flex flex-wrap gap-2">
              {trustBadges.map((item) => (
                <Badge key={item.label} variant="secondary" className="gap-2 px-3 py-1">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </Badge>
              ))}
            </div>
            <div className="rounded-lg bg-background border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{activeCase.title}</div>
                  <p className="text-sm text-muted-foreground">{activeCase.detail}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Resultado</div>
                  <div className="text-lg font-bold text-primary">{activeCase.metric}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Case anterior"
                    className="h-9 w-9 rounded-full border bg-white shadow-sm hover:bg-muted/60 transition"
                    onClick={prev}
                  >
                    <ArrowLeft className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    type="button"
                    aria-label="PrA?ximo case"
                    className="h-9 w-9 rounded-full border bg-white shadow-sm hover:bg-muted/60 transition"
                    onClick={next}
                  >
                    <ArrowRight className="h-4 w-4 mx-auto" />
                  </button>
                </div>
                <div className="flex gap-2">
                  {successCases.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-2.5 w-2.5 rounded-full transition ${idx === caseIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500" aria-label={`${item.rating} estrelas`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`h-4 w-4 ${idx < item.rating ? '' : 'text-muted-foreground/30'}`} fill={idx < item.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">“{item.quote}”</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
