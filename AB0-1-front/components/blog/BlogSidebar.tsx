'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  ArrowRight,
  Calculator,
  BookOpen,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { toast } from '@/hooks/use-toast';

type SidebarCompany = {
  id: number;
  name: string;
  rating: number;
  city: string;
  logo_url?: string;
};

interface BlogSidebarProps {
  verifiedCompanies?: SidebarCompany[];
}

const MOST_READ_ARTICLES = [
  {
    rank: 1,
    title: 'Top 10 Fabricantes de Painéis Solares do Mundo em 2026',
    time: '12 min de leitura',
    href: '/blog/top-10-fabricantes-paineis-solares-mundo-2026',
  },
  {
    rank: 2,
    title: 'Quanto custa hoje ter energia solar? Veja os números atualizados',
    time: '8 min de leitura',
    href: '/blog/quanto-custa-ter-energia-solar-numeros-atualizados',
  },
  {
    rank: 3,
    title: 'Carregador veicular em casa: o que você precisa saber antes de instalar',
    time: '6 min de leitura',
    href: '/blog/carregador-veicular-em-casa-guia-instalacao',
  },
];

export function BlogSidebar({ verifiedCompanies: _verifiedCompanies = [] }: BlogSidebarProps) {
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [selectedState, setSelectedState] = React.useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, insira um endereço de e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Inscrição confirmada!',
      description: 'Você receberá nossos melhores conteúdos e análises.',
    });
    setNewsletterEmail('');
  };

  const handleSimulate = () => {
    openQuoteWizard({
      source: 'blog_sidebar_state',
      decisionContext: selectedState ? { state: selectedState } : undefined,
    });
  };

  return (
    <aside className="space-y-4">
      {/* 1. Card Patrocinado / Presença no momento certo */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-[0_4px_20px_rgba(16,17,20,0.035)]">
        <div className="flex items-center justify-between mb-4">
          <BrandLogo className="h-6 w-auto" />
          <span className="rounded-full bg-[#101114] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            Patrocinado
          </span>
        </div>

        <h3 className="text-lg font-bold text-[#101114] leading-snug tracking-tight">
          Presença no momento certo.
        </h3>

        <p className="mt-2 text-xs text-[#667085] leading-relaxed">
          Entre em contato e destaque sua empresa para quem busca soluções em energia solar e mobilidade elétrica.
        </p>

        <Button
          className="mt-4 w-full h-10 rounded-xl bg-[#FFD21F] hover:bg-[#F5C814] text-[#101114] font-bold text-xs shadow-sm transition-all hover:shadow hover:-translate-y-0.5 border border-[#F0C51E]"
          onClick={() => openQuoteWizard({ source: 'blog_sidebar_ad' })}
        >
          Anuncie no Avalia Solar
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
        </Button>
      </div>

      {/* 2. Card Newsletter */}
      <div className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-[0_4px_20px_rgba(16,17,20,0.035)]">
        <div className="flex items-center gap-2 mb-1.5">
          <Mail className="h-4 w-4 text-[#FFD21F]" aria-hidden="true" />
          <h3 className="text-sm font-bold text-[#101114]">
            Receba nossos artigos
          </h3>
        </div>
        <p className="text-xs text-[#667085] mb-3.5 leading-relaxed">
          Conteúdo exclusivo direto no seu e-mail.
        </p>

        <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
          <div className="relative">
            <Input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-10 rounded-xl border-[#E8EAED] bg-white text-xs text-[#101114] placeholder:text-slate-400 focus-visible:ring-[#155EEF]"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-10 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          >
            Quero receber
          </Button>
        </form>
      </div>

      {/* 3. Card Simulação / Onde você mora */}
      <div className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-[0_4px_20px_rgba(16,17,20,0.035)] space-y-3.5">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[#155EEF]" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-[#101114]">
              Simular Economia Solar
            </h3>
            <p className="text-[11px] text-[#667085]">
              Descubra o potencial da sua conta de luz.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sidebar-state" className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
            Onde você mora?
          </Label>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger
              id="sidebar-state"
              className="h-10 rounded-xl border-[#E8EAED] text-xs text-[#101114] focus:ring-[#155EEF]"
            >
              <SelectValue placeholder="Selecione seu estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo (SP)</SelectItem>
              <SelectItem value="rj">Rio de Janeiro (RJ)</SelectItem>
              <SelectItem value="mg">Minas Gerais (MG)</SelectItem>
              <SelectItem value="pr">Paraná (PR)</SelectItem>
              <SelectItem value="sc">Santa Catarina (SC)</SelectItem>
              <SelectItem value="rs">Rio Grande do Sul (RS)</SelectItem>
              <SelectItem value="ba">Bahia (BA)</SelectItem>
              <SelectItem value="go">Goiás (GO)</SelectItem>
              <SelectItem value="mt">Mato Grosso (MT)</SelectItem>
              <SelectItem value="ce">Ceará (CE)</SelectItem>
              <SelectItem value="pe">Pernambuco (PE)</SelectItem>
              <SelectItem value="other">Outros Estados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full h-10 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          onClick={handleSimulate}
        >
          Receber Orçamento Grátis
        </Button>
      </div>

      {/* 4. Card Artigos Mais Lidos */}
      <div className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-[0_4px_20px_rgba(16,17,20,0.035)]">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <BookOpen className="h-4 w-4 text-[#FFD21F]" aria-hidden="true" />
          <h3 className="text-xs font-bold text-[#101114] uppercase tracking-wider">
            Artigos mais lidos
          </h3>
        </div>

        <div className="space-y-3.5">
          {MOST_READ_ARTICLES.map((article) => (
            <Link
              key={article.rank}
              href={article.href}
              className="group flex items-start gap-3 transition-colors"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F8] text-xs font-bold text-[#101114] group-hover:bg-[#FFD21F] transition-colors">
                {article.rank}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[#101114] leading-snug line-clamp-2 group-hover:text-[#155EEF] transition-colors [text-wrap:balance]">
                  {article.title}
                </h4>
                <p className="mt-1 text-[11px] text-[#667085]">
                  {article.time}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#155EEF] hover:text-blue-700 transition-colors"
          >
            Ver todos os artigos
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
