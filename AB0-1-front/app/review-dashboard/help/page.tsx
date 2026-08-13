'use client';

import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { ActionCard } from '@/components/review-dashboard/cards/ActionCard';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { DashboardSkeleton } from '@/components/review-dashboard/DashboardSkeleton';
import { useDashboardContext } from '../DashboardLayoutClient';
import {
  HelpCircle,
  BookOpen,
  Video,
  FileText,
  Search,
  MessageSquare,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function AjudaPage() {
  const { loading } = useDashboardContext();
  const [search, setSearch] = useState('');

  if (loading) return <DashboardSkeleton variant="page" />;

  const faqs = [
    {
      q: 'Como publicar minha primeira avaliação?',
      a: 'Acesse o catálogo de empresas, encontre a empresa desejada e clique em "Avaliar". Preencha a nota e o comentário detalhado.',
    },
    {
      q: 'Como ganhar pontos e subir de nível?',
      a: 'Completando seu perfil, cadastrando as soluções que você usa, publicando avaliações completas e recebendo votos úteis.',
    },
    {
      q: 'Como funciona o sistema de recompensas?',
      a: 'Seus pontos podem ser trocados por cupons de desconto, cashback e vale-compras em nossos parceiros homologados.',
    },
  ];

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Ajuda e suporte"
        description="Estamos aqui para ajudar você a ter a melhor experiência."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Ajuda e suporte' },
        ]}
      />

      {/* Hero de busca */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1 min-w-[280px]">
          <h2 className="text-xl font-bold text-slate-900">Como podemos ajudar hoje?</h2>
          <p className="text-sm text-slate-500">Busque por dúvidas, tutoriais e guias rápidos.</p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: como publicar avaliação, resgatar cupom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
              Buscar
            </button>
          </div>
        </div>
        {/* Support avatar/illustration placeholder */}
        <div className="shrink-0 bg-blue-50/50 rounded-2xl p-6 hidden md:block">
          <HelpCircle className="h-20 w-20 text-blue-500" />
        </div>
      </div>

      {/* Acesso rápido */}
      <div>
        <SectionHeader title="Acesso rápido" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Tutoriais"
            description="Aprenda a usar a plataforma"
            icon={BookOpen}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <ActionCard
            title="Perguntas frequentes"
            description="Tire suas dúvidas rápidas"
            icon={HelpCircle}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
          <ActionCard
            title="Vídeos explicativos"
            description="Assista a tutoriais guiados"
            icon={Video}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
          />
          <ActionCard
            title="Guias e artigos"
            description="Leia artigos detalhados"
            icon={FileText}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
          />
        </div>
      </div>

      {/* FAQ & Contact grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* FAQs */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <SectionHeader title="Dúvidas mais populares" />
          <div className="space-y-1">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} title={faq.q}>
                {faq.a}
              </AccordionItem>
            ))}
          </div>
        </div>

        {/* Support rail */}
        <div className="space-y-6">
          {/* Precisa de atendimento */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Precisa de suporte?" />
            <p className="text-xs text-slate-500 mb-4 leading-4">
              Nossa equipe está disponível de Seg a Sex (08h às 18h) e Sab (08h às 12h).
            </p>
            <div className="space-y-2">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 py-2.5 text-xs font-bold text-slate-900 hover:bg-amber-500 transition-colors">
                <MessageSquare className="h-4 w-4" />
                Falar no WhatsApp
              </button>
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Mail className="h-4 w-4" />
                Abrir chamado
              </button>
            </div>
          </div>

          <TipCard title="Dica de atendimento">
            Nosso tempo médio de resposta no chat/WhatsApp é de apenas 15 minutos.
          </TipCard>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-slate-900"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="pb-3 text-xs text-slate-600 leading-5">{children}</div>}
    </div>
  );
}
