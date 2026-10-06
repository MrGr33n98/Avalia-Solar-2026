'use client';

import { useState } from 'react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import { canDecide, formatDate, formatMoney } from '@/lib/marketplace-proposals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VersionContent } from './ProposalSummary';

export function ProposalNegotiation({
  proposal,
  onUpdated,
  onChoose,
}: {
  proposal: MarketplaceProposal;
  onUpdated: (proposal: MarketplaceProposal) => void;
  onChoose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const versions = [...(proposal.versions || [])]
    .filter((version) => version.status === 'published')
    .sort((a, b) => b.number - a.number);
  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold">Histórico de versões</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe as condições publicadas pela empresa. A escolha considera a versão atual.
        </p>
        <ol className="mt-4 space-y-3">
          {versions.map((version) => (
            <li key={version.id || version.number} className="border-l-2 border-border pl-4">
              <details>
                <summary className="min-h-11 cursor-pointer py-2 text-sm">
                  <span className="font-semibold">Versão {version.number}</span>
                  {version.number === proposal.version?.number && (
                    <span className="ml-2 text-xs text-primary">Atual</span>
                  )}
                  <span className="mt-1 block font-semibold tabular-nums">
                    {formatMoney(version.total_cents, version.currency)}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatDate(version.published_at, true)} · Ver detalhes
                  </span>
                </summary>
                <div className="py-4">
                  <VersionContent version={version} />
                </div>
              </details>
            </li>
          ))}
        </ol>
        {!versions.length && (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma versão publicada disponível.</p>
        )}
      </section>
      {canDecide(proposal) && (
        <form
          className="space-y-3 border-t border-border pt-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || !reason.trim()) return;
            setBusy(true);
            setError('');
            try {
              onUpdated(
                (await marketplaceProposalsApi.requestChange(proposal.id, reason.trim())).proposal
              );
              setReason('');
              setSent(true);
            } catch {
              setError('Não foi possível enviar o pedido de alteração. Tente novamente.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="negotiation-reason" className="block text-sm font-medium">
            O que você gostaria de ajustar?
          </label>
          <Textarea
            id="negotiation-reason"
            maxLength={1000}
            required
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setSent(false);
            }}
            placeholder="Ex.: revisar o equipamento ou as condições de pagamento."
            disabled={busy}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {sent && (
            <p role="status" className="text-sm text-primary">
              Pedido enviado. Aguarde o retorno da empresa ou uma nova versão.
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            disabled={busy || !reason.trim()}
            className="w-full"
          >
            {busy ? 'Enviando…' : 'Solicitar alteração'}
          </Button>
          <Button type="button" onClick={onChoose} disabled={busy} className="w-full">
            Escolher versão atual
          </Button>
        </form>
      )}
    </div>
  );
}
