'use client';

import Link from 'next/link';
import { FileText, Link2, LineChart, UserRound, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const cards = [
  { label: 'Publicações', description: 'Crie e gerencie conteúdo público.', href: '/creator-studio/publications', icon: FileText },
  { label: 'Perfil público', description: 'Edite identidade e apresentação Creator.', href: '/creator-studio/profile', icon: UserRound },
  { label: 'Tree', description: 'Organize links e destinos da sua audiência.', href: '/creator-studio/tree', icon: Link2 },
  { label: 'Leads', description: 'Acompanhe oportunidades capturadas pelo perfil.', href: '/creator-studio/leads', icon: Users },
  { label: 'Analytics', description: 'Consulte métricas de conteúdo e perfil.', href: '/creator-studio/analytics', icon: LineChart },
];

export default function CreatorStudioPage() {
  const { reviewerProfile } = useAuth();
  const slug = reviewerProfile?.public_slug;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Gestão Creator</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-950">Visão geral</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Gerencie publicações, perfil público, Tree, leads e analytics em espaço separado do seu painel de avaliações.</p>
      </div>
      {slug && (
        <Link href={`/creators/${encodeURIComponent(slug)}`} className="inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100">
          Ver meu perfil público
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <Icon className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-bold text-slate-900">{card.label}</h3>
              <p className="mt-1 text-sm text-slate-500">{card.description}</p>
            </Link>
          );
        })}
      </div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-sm text-blue-900">
        Feed permanece superfície social. Use <Link href="/feed" className="font-bold underline">/feed</Link> para consumir e interagir com conteúdo.
      </div>
    </div>
  );
}
