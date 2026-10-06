'use client';

import { useEffect, useState } from 'react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  technicalFields,
  termValue,
} from '@/lib/marketplace-proposals';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

export function ProposalComparison({
  ids,
  onOpen,
  onChoose,
}: {
  ids: number[];
  onOpen: (proposal: MarketplaceProposal) => void;
  onChoose: (proposal: MarketplaceProposal) => void;
}) {
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const idKey = ids.join(',');
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    marketplaceProposalsApi
      .compare(idKey.split(',').map(Number))
      .then((response) => {
        if (current) setProposals(response.proposals);
      })
      .catch(() => {
        if (current) setError(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [idKey, attempt]);

  if (loading)
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Carregando comparação…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="space-y-4">
        <p>Não foi possível carregar a comparação.</p>
        <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
          Tentar novamente
        </Button>
      </div>
    );
  if (proposals.length < 2)
    return <p role="status">Selecione pelo menos duas propostas disponíveis para comparar.</p>;

  const rows = [
    {
      label: 'Valor total',
      value: (p: MarketplaceProposal) =>
        formatMoney(p.version?.total_cents ?? p.total_cents, p.currency),
    },
    ...technicalFields.map((field) => ({
      label: field.label,
      value: (p: MarketplaceProposal) => termValue(p, field.keys),
    })),
    {
      label: 'Equipamentos',
      value: (p: MarketplaceProposal) =>
        p.version?.items.map((item) => `${item.quantity} ${item.unit} · ${item.name}`).join('\n') ||
        'Não informado',
    },
    {
      label: 'Validade',
      value: (p: MarketplaceProposal) => formatDate(p.expires_at || p.version?.valid_until),
    },
    {
      label: 'Avaliação',
      value: (p: MarketplaceProposal) =>
        p.company.reviews_count
          ? `${Number(p.company.rating_avg).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} (${p.company.reviews_count} avaliações)`
          : 'Sem avaliações',
    },
    {
      label: 'Verificação',
      value: (p: MarketplaceProposal) => (p.company.verified ? 'Verificada' : 'Não informada'),
    },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compare os dados informados pelas empresas. No celular, deslize a tabela para ver todas as
        propostas.
      </p>
      <div
        role="region"
        aria-label="Tabela comparativa de propostas"
        tabIndex={0}
        className="max-w-full overflow-x-auto rounded-xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <table className="w-full min-w-[560px] table-fixed text-sm">
          <caption className="sr-only">
            Condições técnicas e comerciais das propostas selecionadas
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-32 bg-muted/50 p-3 text-left font-medium">
                Condições
              </th>
              {proposals.map((p) => (
                <th scope="col" key={p.id} className="w-52 border-l border-border p-4 text-left">
                  <CompanyMark proposal={p} />
                  <p className="mt-3 font-semibold">{p.company.name}</p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">{p.reference}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <th
                  scope="row"
                  className="bg-muted/50 p-3 text-left text-xs font-medium text-muted-foreground"
                >
                  {row.label}
                </th>
                {proposals.map((p) => (
                  <td
                    key={p.id}
                    className="whitespace-pre-line break-words border-l border-border p-4 align-top tabular-nums"
                  >
                    {row.value(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th scope="row" className="bg-muted/50 p-3 text-left text-xs font-medium">
                Próximo passo
              </th>
              {proposals.map((p) => (
                <td key={p.id} className="space-y-2 border-l border-border p-3">
                  <Button variant="outline" className="w-full" onClick={() => onOpen(p)}>
                    Ver detalhes
                  </Button>
                  <Button
                    className="w-full"
                    disabled={!canDecide(p)}
                    onClick={() => onChoose(p)}
                    aria-label={`Escolher ${p.company.name}`}
                  >
                    Escolher proposta
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
