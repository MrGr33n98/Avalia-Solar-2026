'use client';

import { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  DollarSign,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Battlecard = {
  id: string;
  category: 'price' | 'competitor' | 'tax' | 'decision';
  objection: string;
  talkTrack: string;
  whatsappMessage: string;
};

export default function SolarSalesBattlecards() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const battlecards: Battlecard[] = [
    {
      id: 'price-high',
      category: 'price',
      objection: '1. "Achei o valor do investimento em energia solar muito alto"',
      talkTrack:
        'Entendo perfeitamente sua preocupação com o capital inicial. Porém, a usina fotovoltaica não é um custo, e sim uma substituição de passivo: você troca o pagamento vitalício da tarifa para a concessionária por um ativo fixo que se paga em ~3 a 4 anos e gera energia gratuita por mais de 25 anos. Além disso, no financiamento solar, a própria economia mensal cobre a parcela do banco sem afetar o caixa da empresa.',
      whatsappMessage:
        'Olá! Entendo totalmente sua preocupação com o valor inicial. A grande vantagem é que não se trata de uma despesa extra: a parcela do investimento é coberta pela própria economia na conta de luz, gerando caixa positivo desde o primeiro ano e garantia de 25 anos. Posso te enviar uma simulação deste fluxo de caixa neutro?',
    },
    {
      id: 'cheaper-competitor',
      category: 'competitor',
      objection: '2. "Tenho um orçamento mais barato de outro integrador da região"',
      talkTrack:
        'No mercado fotovoltaico, uma variação de preço geralmente significa diferença na qualidade dos inversores (string vs microinversores), eficiência dos módulos ou ausência de seguro de engenharia e suporte pós-venda. O Avalia Solar garante homologação junto à concessionária, estrutura com proteção contra vendavais e monitoramento em tempo real.',
      whatsappMessage:
        'Com certeza é importante comparar! Uma dica crucial na energia solar é verificar se o orçamento menor inclui seguro de engenharia, inversores com garantia estendida e suporte de homologação na concessionária. A diferença de poucas centenas de reais no equipamento pode custar anos de perda de geração. Quer que eu faça um comparativo técnico rápido das duas propostas?',
    },
    {
      id: 'law-14300',
      category: 'tax',
      objection: '3. "Tenho dúvida se ainda vale a pena com a Lei 14.300 (Taxação do Sol)"',
      talkTrack:
        'A Lei 14.300 trouxe segurança jurídica definitiva para o setor fotovoltaico. O pagamento gradual do Fio B representa um impacto residual de menos de 10% a 15% na economia total. Ou seja, você continua economizando entre 85% e 90% na sua fatura todos os meses.',
      whatsappMessage:
        'Excelente ponto! A Lei 14.300 trouxe regulação clara para o setor. Mesmo com o pagamento gradual do Fio B, a economia líquida permanece entre 85% e 90% da sua fatura mensal. O retorno do investimento continua sendo um dos mais atrativos do mercado financeiro (~25% a.a.).',
    },
    {
      id: 'partner-approval',
      category: 'decision',
      objection: '4. "Preciso apresentar para a diretoria / conversar com meus sócios"',
      talkTrack:
        'Perfeito. Para facilitar a aprovação da diretoria, preparei um Executive One-Pager de 1 página condensando o investimento, economia estimada e prazo de payback. Posso participar de uma breve call de 15 minutos com vocês para responder às dúvidas técnicas do time financeiro.',
      whatsappMessage:
        'Com certeza! Para ajudar na apresentação aos sócios/diretoria, posso enviar um resumo executivo em PDF de 1 página focado nos números (Investimento vs Economia acumulada). O que acha de agendarmos 15 minutos para eu apresentar direto para o time de decisões?',
    },
  ];

  const filteredCards = battlecards.filter(
    (b) =>
      b.objection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.talkTrack.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold">
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-amber-700" /> Sales Battlecards & Objeções
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-white border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-amber-600 font-bold text-white">Sales Playbook B2B</Badge>
            <span className="text-xs text-slate-500 font-semibold">Contorno Expresso de Objeções Solares</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Battlecards Comerciais Avalia Solar
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Guia prático de argumentos para ligações ao vivo e mensagens de WhatsApp durante negociações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar objeção (ex: Preço, Concorrente, Lei 14.300, Sócios)..."
            className="bg-slate-50 border-slate-300 text-xs font-medium"
          />

          <div className="max-h-96 overflow-y-auto space-y-3.5 pr-1">
            {filteredCards.map((card) => (
              <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{card.objection}</h4>
                  <Badge variant="outline" className="border-slate-300 bg-white font-mono text-[10px] uppercase text-slate-600">
                    {card.category}
                  </Badge>
                </div>

                <div className="rounded-lg bg-white p-3 border border-slate-200 text-xs leading-relaxed text-slate-800 space-y-1">
                  <p className="font-bold text-blue-950 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-800" /> Pitch Verbal durante a Chamada:
                  </p>
                  <p className="text-slate-700">{card.talkTrack}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Script pronto para WhatsApp:
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(card.id, card.whatsappMessage)}
                    className="h-8 border-slate-300 bg-white text-xs hover:bg-slate-50 font-bold"
                  >
                    {copiedId === card.id ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5 text-slate-600" /> Copiar Mensagem WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
