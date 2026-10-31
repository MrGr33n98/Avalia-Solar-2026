'use client';

import { useEffect, useState } from 'react';
import { Building2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { salesApi } from '@/lib/api/sales/client';
import type { ApiCompetitor } from '@/lib/api/sales/types';

export type LostReason =
  | 'lost_to_competitor'
  | 'price_terms'
  | 'project_cancelled'
  | 'no_response'
  | 'other';

export interface LostOpportunityPayload {
  lostReason: LostReason;
  lostNotes?: string;
  competitorId?: number;
}

interface LostOpportunityDialogProps {
  open: boolean;
  opportunityName?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: LostOpportunityPayload) => Promise<void>;
}

const REASONS: Array<{ value: LostReason; label: string }> = [
  { value: 'lost_to_competitor', label: 'Perdido para concorrente' },
  { value: 'price_terms', label: 'Preço ou condições comerciais' },
  { value: 'project_cancelled', label: 'Projeto cancelado pelo cliente' },
  { value: 'no_response', label: 'Sem retorno do contato' },
  { value: 'other', label: 'Outro motivo' },
];

export default function LostOpportunityDialog({
  open,
  opportunityName,
  onOpenChange,
  onConfirm,
}: LostOpportunityDialogProps) {
  const [reason, setReason] = useState<LostReason>('lost_to_competitor');
  const [notes, setNotes] = useState('');
  const [competitors, setCompetitors] = useState<ApiCompetitor[]>([]);
  const [competitorChoice, setCompetitorChoice] = useState('');
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setReason('lost_to_competitor');
    setNotes('');
    setCompetitorChoice('');
    setNewCompetitorName('');
    setError(null);
    setLoadingCompetitors(true);

    salesApi
      .getCompetitors()
      .then((items) => {
        if (active) setCompetitors(items);
      })
      .catch((cause: unknown) => {
        if (active) {
          setCompetitors([]);
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os concorrentes cadastrados.'
          );
        }
      })
      .finally(() => {
        if (active) setLoadingCompetitors(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      let competitorId: number | undefined;
      if (reason === 'lost_to_competitor') {
        if (competitorChoice === '__new__') {
          const name = newCompetitorName.trim();
          if (!name) {
            setError('Informe o nome do novo concorrente.');
            return;
          }
          const competitor = await salesApi.createCompetitor({ name });
          competitorId = competitor.id;
        } else {
          competitorId = Number(competitorChoice) || undefined;
        }

        if (!competitorId) {
          setError('Selecione ou cadastre o concorrente responsável pela perda.');
          return;
        }
      }

      await onConfirm({
        lostReason: reason,
        lostNotes: notes.trim() || undefined,
        competitorId,
      });
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível registrar a perda da oportunidade.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
      <DialogContent
        overlayClassName="z-[10010]"
        className="z-[10020] w-[calc(100vw-1.5rem)] max-w-md border-slate-200 bg-white"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700">
              <XCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <DialogTitle className="text-base font-bold text-slate-900">
              Registrar perda da oportunidade
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-600">
            Registre dados estruturados para análise de win/loss
            {opportunityName ? ` de “${opportunityName}”` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="lost-reason" className="font-semibold text-slate-700">
              Motivo principal
            </label>
            <select
              id="lost-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value as LostReason);
                setError(null);
              }}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              {REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {reason === 'lost_to_competitor' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label
                htmlFor="lost-competitor"
                className="flex items-center gap-1.5 font-semibold text-slate-800"
              >
                <Building2 className="h-3.5 w-3.5 text-blue-900" aria-hidden="true" />
                Concorrente ou integrador
              </label>
              <select
                id="lost-competitor"
                value={competitorChoice}
                disabled={loadingCompetitors}
                aria-describedby="lost-competitor-hint"
                onChange={(event) => {
                  setCompetitorChoice(event.target.value);
                  setError(null);
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 disabled:opacity-60"
              >
                <option value="">
                  {loadingCompetitors ? 'Carregando concorrentes…' : 'Selecione um concorrente'}
                </option>
                {competitors.map((competitor) => (
                  <option key={competitor.id} value={competitor.id}>
                    {competitor.name}
                  </option>
                ))}
                <option value="__new__">Cadastrar novo concorrente…</option>
              </select>
              <p id="lost-competitor-hint" className="text-[11px] text-slate-500">
                A seleção fica vinculada à oportunidade e alimenta a análise competitiva.
              </p>

              {competitorChoice === '__new__' && (
                <div className="space-y-1.5">
                  <label htmlFor="new-competitor-name" className="font-semibold text-slate-700">
                    Nome do novo concorrente
                  </label>
                  <Input
                    id="new-competitor-name"
                    value={newCompetitorName}
                    onChange={(event) => setNewCompetitorName(event.target.value)}
                    placeholder="Nome da empresa ou integrador"
                    className="h-10 bg-white text-xs"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="lost-notes" className="font-semibold text-slate-700">
              Observações do fechamento
            </label>
            <Textarea
              id="lost-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Contexto informado pelo cliente (opcional)"
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={submitting || loadingCompetitors}
              className="bg-red-600 font-semibold text-white hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Registrando…
                </>
              ) : (
                'Confirmar perda'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
