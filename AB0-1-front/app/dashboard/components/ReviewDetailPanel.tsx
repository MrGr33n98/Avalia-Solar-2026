'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  Link2,
  MapPin,
  MessageSquareReply,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { dashboardApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ReviewDetailPanelProps {
  companyId: string;
  reviewId: string;
  onBack: () => void;
  onChanged: () => void;
}

interface AuditEvent {
  id: string;
  event_type: string;
  actor_name: string;
  actor_type: string;
  previous_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  created_at: string;
}

interface ReviewDetail {
  id: number;
  rating: number;
  headline: string;
  comment: string;
  pros: string[];
  cons: string[];
  buyer_tip?: string;
  status: string;
  moderation: { status: string; notes?: string; changed_at?: string };
  verification: { status: string; verified: boolean; notes?: string; changed_at?: string };
  reply?: string;
  replied_at?: string;
  reply_status: 'answered' | 'unanswered';
  reviewer: { name: string; city?: string; state?: string };
  source: {
    channel?: string;
    token?: string;
    review_form_id?: number;
    review_form_name?: string;
    landing_path?: string;
    referrer?: string;
    user_agent?: string;
    ip_hash_present: boolean;
    submitted_at?: string;
  };
  nps_score?: number;
  classification_by_rating: 'positive' | 'neutral' | 'negative';
  criteria: Array<{ title: string; score: number; weight?: number }>;
  form_answers: Record<string, unknown>;
  helpful_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  audit_trail: AuditEvent[];
}

interface Permissions {
  can_reply: boolean;
  can_moderate: boolean;
  can_verify: boolean;
}

const MODERATION_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  in_analysis: 'Em análise',
  flagged: 'Sinalizada',
  contested: 'Contestada',
};

const VERIFICATION_LABELS: Record<string, string> = {
  unverified: 'Não verificada',
  pending: 'Pendente',
  in_review: 'Em análise',
  manually_verified: 'Verificada manualmente',
  rejected: 'Verificação rejeitada',
};

const SOURCE_LABELS: Record<string, string> = {
  qr_code_form: 'QR Code',
  custom_review_form: 'Formulário público',
  profile: 'Página da empresa',
  lead: 'Lead',
  chat: 'Chat',
  dashboard: 'Dashboard',
  unknown: 'Desconhecido',
};

const EVENT_LABELS: Record<string, string> = {
  reply_created: 'Resposta publicada',
  reply_updated: 'Resposta editada',
  reply_deleted: 'Resposta removida',
  moderation_changed: 'Moderação alterada',
  verification_changed: 'Verificação alterada',
  review_contested: 'Avaliação contestada',
};

function formatDate(value?: string) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-200 dark:text-slate-700'
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewDetailPanel({
  companyId,
  reviewId,
  onBack,
  onChanged,
}: ReviewDetailPanelProps) {
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({
    can_reply: false,
    can_moderate: false,
    can_verify: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await dashboardApi.getSocialProofReview(reviewId, companyId)) as Record<
        string,
        unknown
      >;
      const loadedReview = response.review as ReviewDetail;
      setReview(loadedReview);
      setPermissions((response.permissions || {}) as Permissions);
      setReplyBody(loadedReview.reply || '');
    } catch (requestError) {
      console.error('Failed to load review detail:', requestError);
      setError('Não foi possível carregar os detalhes da avaliação.');
    } finally {
      setLoading(false);
    }
  }, [companyId, reviewId]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  const saveReply = async () => {
    if (!review || !replyBody.trim()) return;
    try {
      setSaving(true);
      if (review.reply_status === 'answered') {
        await dashboardApi.updateReviewReply(review.id, replyBody.trim(), companyId);
      } else {
        await dashboardApi.createReviewReply(review.id, replyBody.trim(), companyId);
      }
      await loadReview();
      onChanged();
      setEditingReply(false);
      toast({
        title: review.reply_status === 'answered' ? 'Resposta atualizada' : 'Resposta publicada',
      });
    } catch (requestError) {
      console.error('Failed to save review reply:', requestError);
      toast({ title: 'Não foi possível salvar a resposta', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteReply = async () => {
    if (!review) return;
    try {
      setSaving(true);
      await dashboardApi.deleteReviewReply(review.id, companyId);
      await loadReview();
      onChanged();
      setEditingReply(false);
      setConfirmDelete(false);
      toast({
        title: 'Resposta removida',
        description: 'O histórico foi preservado para auditoria.',
      });
    } catch (requestError) {
      console.error('Failed to delete review reply:', requestError);
      toast({ title: 'Não foi possível remover a resposta', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkflow = async (kind: 'moderation' | 'verification', status: string) => {
    if (!review) return;
    try {
      setSaving(true);
      if (kind === 'moderation') {
        await dashboardApi.updateReviewModeration(review.id, status, undefined, companyId);
      } else {
        await dashboardApi.updateReviewVerification(review.id, status, undefined, companyId);
      }
      await loadReview();
      onChanged();
      toast({ title: kind === 'moderation' ? 'Moderação atualizada' : 'Verificação atualizada' });
    } catch (requestError) {
      console.error('Failed to update review workflow:', requestError);
      toast({ title: 'Não foi possível atualizar o status', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-8" />
          <Skeleton className="h-96 lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <p className="text-sm font-medium text-red-800">{error || 'Avaliação não encontrada.'}</p>
          <Button variant="outline" onClick={() => void loadReview()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label="Voltar para avaliações"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">
              Ficha operacional
            </p>
            <h3 className="text-xl font-bold text-slate-950 dark:text-white">
              Avaliação #{review.id}
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{MODERATION_LABELS[review.status] || review.status}</Badge>
          <Badge
            variant="outline"
            className={cn(
              review.verification.verified
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            )}
          >
            {VERIFICATION_LABELS[review.verification.status] || review.verification.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-950 dark:text-white">
                      {review.reviewer.name}
                    </h4>
                    {review.verification.verified && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
                  </div>
                </div>
                {(review.reviewer.city || review.reviewer.state) && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {[review.reviewer.city, review.reviewer.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              {review.headline && (
                <h5 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                  {review.headline}
                </h5>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                {review.comment || 'Avaliação enviada sem comentário.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Classificação pela nota
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {review.classification_by_rating === 'positive'
                      ? 'Positiva'
                      : review.classification_by_rating === 'neutral'
                        ? 'Neutra'
                        : 'Negativa'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">NPS</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {review.nps_score ?? 'Não respondido'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Útil para</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {review.helpful_count} pessoas
                  </p>
                </div>
              </div>

              {review.criteria.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/10">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Critérios avaliados
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {review.criteria.map((criterion) => (
                      <div
                        key={criterion.title}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-white/[0.03]"
                      >
                        <span className="text-slate-600 dark:text-slate-300">
                          {criterion.title}
                        </span>
                        <strong className="tabular-nums">
                          {Number(criterion.score).toFixed(1)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareReply className="h-4 w-4 text-brand-blue" /> Resposta da empresa
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Alterações ficam registradas na trilha de auditoria.
                </p>
              </div>
              {review.reply_status === 'answered' && !editingReply && permissions.can_reply && (
                <Button variant="outline" size="sm" onClick={() => setEditingReply(true)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {review.reply_status === 'answered' && !editingReply ? (
                <div className="rounded-lg border-l-2 border-brand-blue bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {review.reply}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(review.replied_at)}
                    </span>
                    {permissions.can_reply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
                      </Button>
                    )}
                  </div>
                </div>
              ) : permissions.can_reply ? (
                <div>
                  <Textarea
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Escreva uma resposta objetiva, respeitosa e útil para o cliente."
                    maxLength={2000}
                    rows={5}
                    className="resize-none bg-slate-50"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] tabular-nums text-slate-400">
                      {replyBody.length}/2000
                    </span>
                    <div className="flex gap-2">
                      {editingReply && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingReply(false);
                            setReplyBody(review.reply || '');
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button
                        onClick={() => void saveReply()}
                        disabled={saving || !replyBody.trim()}
                        className="bg-brand-blue text-white hover:bg-brand-blue/90"
                      >
                        {saving
                          ? 'Salvando...'
                          : review.reply_status === 'answered'
                            ? 'Salvar alteração'
                            : 'Publicar resposta'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Você não possui permissão para responder esta avaliação.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-brand-blue" /> Status operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Moderação</p>
                <p className="mt-1 text-sm font-semibold">
                  {MODERATION_LABELS[review.moderation.status] || review.moderation.status}
                </p>
                {review.moderation.notes && (
                  <p className="mt-1 text-xs text-slate-500">{review.moderation.notes}</p>
                )}
              </div>
              <div className="border-t border-slate-100 pt-4 dark:border-white/10">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Verificação</p>
                <p className="mt-1 text-sm font-semibold">
                  {VERIFICATION_LABELS[review.verification.status] || review.verification.status}
                </p>
                {review.verification.notes && (
                  <p className="mt-1 text-xs text-slate-500">{review.verification.notes}</p>
                )}
              </div>
              {(permissions.can_moderate || permissions.can_verify) && (
                <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-white/10">
                  {permissions.can_moderate && (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Ações de moderação
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['approved', 'in_analysis', 'rejected'].map((status) => (
                          <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            disabled={saving || review.status === status}
                            onClick={() => void updateWorkflow('moderation', status)}
                            className="h-8 text-[11px]"
                          >
                            {MODERATION_LABELS[status]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {permissions.can_verify && (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Ações de verificação
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['in_review', 'manually_verified', 'rejected'].map((status) => (
                          <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            disabled={saving || review.verification.status === status}
                            onClick={() => void updateWorkflow('verification', status)}
                            className="h-8 text-[11px]"
                          >
                            {VERIFICATION_LABELS[status]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-brand-blue" /> Origem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-1 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Canal</span>
                <strong>
                  {SOURCE_LABELS[review.source.channel || 'unknown'] || review.source.channel}
                </strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Formulário</span>
                <strong className="text-right">
                  {review.source.review_form_name || 'Não identificado'}
                </strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Enviado em</span>
                <strong className="text-right">{formatDate(review.source.submitted_at)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Rastreio técnico</span>
                <strong>
                  {review.source.ip_hash_present ? 'Preservado com hash' : 'Indisponível'}
                </strong>
              </div>
              {review.source.landing_path && (
                <div className="border-t border-slate-100 pt-3 dark:border-white/10">
                  <p className="text-slate-500">Página de entrada</p>
                  <p className="mt-1 break-all font-medium text-slate-700 dark:text-slate-300">
                    {review.source.landing_path}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-brand-blue" /> Trilha de auditoria
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Histórico imutável de respostas e decisões operacionais.
          </p>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {review.audit_trail.length ? (
            <div className="space-y-0">
              {review.audit_trail.map((event, index) => (
                <div key={event.id} className="relative flex gap-3 pb-5">
                  {index < review.audit_trail.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200 dark:bg-white/10" />
                  )}
                  <span className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-brand-blue dark:border-slate-950" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {EVENT_LABELS[event.event_type] || event.event_type}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {event.actor_name} · {formatDate(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-24 flex-col items-center justify-center text-center">
              <FileText className="mb-2 h-5 w-5 text-slate-300" />
              <p className="text-xs text-slate-500">Nenhuma alteração operacional registrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover resposta pública?</AlertDialogTitle>
            <AlertDialogDescription>
              A resposta deixará de aparecer publicamente, mas seu conteúdo e histórico serão
              preservados para auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void deleteReply()}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remover resposta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
