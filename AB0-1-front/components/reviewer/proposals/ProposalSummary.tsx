'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  MessageCircle,
  ShieldCheck,
  Star,
} from 'lucide-react';
import type { MarketplaceProposal, MarketplaceProposalVersion } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  proposalChatUrl,
  proposalStatus,
  technicalFields,
  termValue,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CompanyMark({ proposal }: { proposal: MarketplaceProposal }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-sm font-semibold text-primary">
      {proposal.company.logo_url && !failed ? (
        <Image
          src={proposal.company.logo_url}
          alt=""
          fill
          sizes="44px"
          className="object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        proposal.company.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
      )}
    </span>
  );
}

export function StatusBadge({ proposal }: { proposal: MarketplaceProposal }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        proposal.status === 'accepted'
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {proposalStatus(proposal)}
    </span>
  );
}

export function VersionContent({ version }: { version: MarketplaceProposalVersion }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{version.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {version.summary || 'Resumo ainda não informado pela empresa.'}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Valor total</dt>
          <dd className="mt-1 font-semibold tabular-nums text-primary">
            {formatMoney(version.total_cents, version.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Validade</dt>
          <dd className="mt-1 font-medium">{formatDate(version.valid_until)}</dd>
        </div>
      </dl>
      <details className="group border-b border-border pb-3" open>
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 font-medium">
          Equipamentos e serviços <ChevronRight className="h-4 w-4 group-open:rotate-90" />
        </summary>
        {version.items.length ? (
          <ul className="divide-y divide-border">
            {version.items.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{item.name}</span>
                  <span className="tabular-nums">
                    {formatMoney(item.total_cents, version.currency)}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {item.quantity} {item.unit}
                  {item.description ? ` · ${item.description}` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-3 text-sm text-muted-foreground">Equipamentos ainda não detalhados.</p>
        )}
      </details>
      <details className="group border-b border-border pb-3" open>
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 font-medium">
          Condições, prazos e garantias <ChevronRight className="h-4 w-4 group-open:rotate-90" />
        </summary>
        {version.terms.length ? (
          <dl className="space-y-3 py-3 text-sm">
            {version.terms.map((term) => (
              <div key={term.id}>
                <dt className="text-muted-foreground">{term.label}</dt>
                <dd className="mt-1 whitespace-pre-line font-medium">{term.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="py-3 text-sm text-muted-foreground">
            Condições ainda não informadas. Confirme os detalhes com a empresa.
          </p>
        )}
      </details>
    </div>
  );
}

export function ProposalSummary({
  proposal,
  onMeeting,
  onChoose,
  onNegotiate,
  onProject,
}: {
  proposal: MarketplaceProposal;
  onMeeting: () => void;
  onChoose: () => void;
  onNegotiate: () => void;
  onProject: () => void;
}) {
  if (!proposal.version) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <FileText className="h-9 w-9 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Proposta em preparação</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A empresa recebeu sua solicitação e está preparando os detalhes técnicos e comerciais.
            Você verá o valor, os equipamentos e as condições aqui assim que a proposta for
            publicada.
          </p>
        </div>
        <Button
          asChild
          className="w-full bg-amber-400 text-slate-950 shadow-none hover:bg-amber-300"
        >
          <Link href={proposalChatUrl(proposal)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Conversar com a empresa
          </Link>
        </Button>
      </div>
    );
  }

  const active =
    proposal.status === 'accepted'
      ? 3
      : proposal.status === 'meeting_scheduled' || proposal.status === 'negotiating'
        ? 2
        : proposal.status === 'sent'
          ? 0
          : 1;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4" />
          {proposal.company.reviews_count
            ? `${Number(proposal.company.rating_avg).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} · ${proposal.company.reviews_count} avaliações`
            : 'Sem avaliações'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-4 w-4" />
          {proposal.company.verified ? 'Empresa verificada' : 'Verificação não informada'}
        </span>
        {proposal.company.founded_year && <span>Desde {proposal.company.founded_year}</span>}
      </div>
      <ol
        aria-label="Progresso da proposta"
        className="grid grid-cols-4 gap-2 border-b border-border pb-5"
      >
        {['Recebida', 'Visualizada', 'Negociação', 'Escolhida'].map((label, index) => (
          <li
            key={label}
            aria-current={index === active ? 'step' : undefined}
            className="min-w-0 text-center"
          >
            <span
              className={cn(
                'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                index <= active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < active ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="mt-2 block text-[11px]">{label}</span>
          </li>
        ))}
      </ol>
      <Tabs defaultValue="summary">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="summary" className="min-h-11 px-1">
            Resumo
          </TabsTrigger>
          <TabsTrigger value="complete" className="min-h-11 px-1">
            Completa
          </TabsTrigger>
          <TabsTrigger value="financial" className="min-h-11 px-1">
            Financeiro
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-5 space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Resumo da proposta</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {proposal.version?.summary || 'A empresa ainda não adicionou um resumo.'}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
            {technicalFields.slice(0, 4).map((field) => (
              <div key={field.label}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 font-medium">{termValue(proposal, field.keys)}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-primary/5 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                {formatMoney(
                  proposal.version?.total_cents ?? proposal.total_cents,
                  proposal.currency
                )}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Validade: {formatDate(proposal.expires_at || proposal.version?.valid_until)}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="complete" className="mt-5 space-y-4">
          {proposal.version ? (
            <VersionContent version={proposal.version} />
          ) : (
            <p className="text-sm text-muted-foreground">A empresa está preparando os detalhes.</p>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href={proposalChatUrl(proposal)}>
              <FileText className="mr-2 h-4 w-4" />
              Arquivos da conversa
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Consulte fotos e PDFs compartilhados pela empresa no chat desta proposta.
          </p>
        </TabsContent>
        <TabsContent value="financial" className="mt-5 space-y-4">
          <h3 className="text-lg font-semibold">Condições comerciais</h3>
          <p className="text-2xl font-semibold tabular-nums text-primary">
            {formatMoney(proposal.version?.total_cents ?? proposal.total_cents, proposal.currency)}
          </p>
          <dl className="space-y-4 text-sm">
            {technicalFields.slice(3).map((field) => (
              <div key={field.label}>
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 font-medium">{termValue(proposal, field.keys)}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      </Tabs>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="bg-amber-400 text-slate-950 shadow-none hover:bg-amber-300">
          <Link href={proposalChatUrl(proposal)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Conversar com a empresa
          </Link>
        </Button>
        {(canDecide(proposal) || proposal.status === 'accepted') && (
          <Button variant="outline" onClick={onMeeting}>
            <CalendarClock className="mr-2 h-4 w-4" />
            Agendar reunião
          </Button>
        )}
      </div>
      {canDecide(proposal) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={onNegotiate}>
            Negociar proposta
          </Button>
          <Button onClick={onChoose}>
            <Check className="mr-2 h-4 w-4" />
            Escolher proposta
          </Button>
        </div>
      )}
      {proposal.status === 'accepted' && (
        <Button onClick={onProject} className="w-full">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Acompanhar projeto
        </Button>
      )}
      {!canDecide(proposal) && proposal.status !== 'accepted' && (
        <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          {proposal.revision_pending
            ? 'A empresa está preparando uma nova versão. Você pode consultar o histórico enquanto aguarda a publicação.'
            : `Esta proposta está ${proposalStatus(proposal).toLowerCase()}. Converse com a empresa para saber os próximos passos.`}
        </p>
      )}
    </div>
  );
}
