'use client';

import Link from 'next/link';
import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
import { ReviewerSkeleton } from '@/components/reviewer/ReviewerSkeleton';
import { ReviewerErrorState } from '@/components/reviewer/ReviewerErrorState';
import { ReviewerEmptyState } from '@/components/reviewer/ReviewerEmptyState';
import { useReviewerProposals } from '@/hooks/reviewer/useReviewerProposals';

const labels: Record<string, string> = { draft: 'Rascunho', pending_otp: 'Aguardando confirmação', verified: 'Confirmada', distributed: 'Enviada às empresas', proposal_submitted: 'Solicitada', proposal_processing: 'Em análise', proposal_sent: 'Recebida', proposal_failed: 'Falhou' };

export default function ReviewerProposalsPage() {
  const { proposals, loading, error, refetch } = useReviewerProposals();
  return <ReviewerShell><div className="space-y-6"><header><Link href="/review-dashboard" className="text-sm font-semibold text-blue-600">Voltar ao painel</Link><h1 className="mt-2 text-3xl font-bold text-slate-950">Minhas propostas</h1><p className="mt-2 text-slate-600">Acompanhe solicitações e atualizações reais.</p></header>{loading ? <ReviewerSkeleton /> : error ? <ReviewerErrorState onRetry={() => void refetch()} /> : proposals.length === 0 ? <ReviewerEmptyState /> : <div className="space-y-3">{proposals.map((proposal) => <article key={proposal.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 className="font-bold text-slate-950">{proposal.company ? typeof proposal.company === 'string' ? proposal.company : proposal.company.name : 'Solicitação de proposta'}</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{labels[proposal.status || ''] || proposal.status || 'Recebida'}</span></div><p className="mt-2 text-sm text-slate-500">{new Date(proposal.created_at).toLocaleDateString('pt-BR')}{proposal.product_vertical ? ` · ${proposal.product_vertical}` : ''}</p>{proposal.message && <p className="mt-3 text-sm text-slate-700">{proposal.message}</p>}</article>)}</div>}</div></ReviewerShell>;
}
