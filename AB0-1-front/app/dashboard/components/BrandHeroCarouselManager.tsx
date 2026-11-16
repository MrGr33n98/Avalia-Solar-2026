'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Send, Trash2 } from 'lucide-react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { getFullImageUrl } from '@/utils/image';

type ManagedSlide = {
  id: number;
  slot: number;
  position: number;
  revision: number;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived';
  alt_text?: string | null;
  image_url?: string | null;
  width?: number | null;
  height?: number | null;
  rejection_reason?: string | null;
};

type ResponseData = {
  enabled: boolean;
  limit: number;
  public_version: string;
  slides: ManagedSlide[];
};

type Props = { companyId: string; companyName: string; legacyBannerUrl?: string | null };

const STATUS: Record<ManagedSlide['status'], string> = {
  draft: 'Rascunho',
  pending_review: 'Em análise',
  approved: 'Aprovado',
  published: 'Publicado',
  rejected: 'Reprovado',
  archived: 'Arquivado',
};

export default function BrandHeroCarouselManager({ companyId, companyName, legacyBannerUrl }: Props) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [altTexts, setAltTexts] = useState<Record<number, string>>({});

  const api = (suffix = '') => buildApiUrl(`company_dashboard/hero_slides${suffix}`);

  const reload = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`company_dashboard/hero_slides?company_id=${encodeURIComponent(companyId)}`), {
        credentials: 'include', headers: getApiRequestHeaders(), cache: 'no-store',
      });
      if (!response.ok) throw new Error('Não foi possível carregar as imagens do hero.');
      const result: ResponseData = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na consulta das imagens');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { void reload(); }, [reload]);

  const request = async (url: string, options: RequestInit, successMessage: string) => {
    setError(null);
    setMessage(null);
    const response = await fetch(url, { credentials: 'include', ...options });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.message || json.error || `Operação rejeitada: HTTP ${response.status}`);
    }
    setMessage(successMessage);
    await reload();
  };

  const upload = async (slot: number, file?: File) => {
    if (!file || !data?.enabled) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use uma imagem PNG, JPG ou WebP.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem acima de 5 MB.'); return;
    }
    setBusy(`upload-${slot}`);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('slot', String(slot));
      payload.append('alt_text', altTexts[slot] || `Banner da empresa ${companyName}`);
      payload.append('company_id', companyId);
      await request(api(), {
        method: 'POST',
        headers: { ...getApiRequestHeaders(), 'Idempotency-Key': crypto.randomUUID() },
        body: payload,
      }, 'Imagem recebida. Envie a revisão para análise antes de publicá-la.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar imagem.');
    } finally {
      setBusy(null);
    }
  };

  const submit = async (slide: ManagedSlide) => {
    setBusy(`submit-${slide.id}`);
    try {
      await request(api(`/${slide.id}/submit?company_id=${encodeURIComponent(companyId)}`), {
        method: 'POST', headers: getApiRequestHeaders(),
      }, 'Revisão enviada. A imagem publicada não foi substituída.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar para análise.');
    } finally { setBusy(null); }
  };

  const archive = async (slide: ManagedSlide) => {
    if (!window.confirm('Arquivar esta revisão sem excluir o arquivo original?')) return;
    setBusy(`archive-${slide.id}`);
    try {
      await request(api(`/${slide.id}?company_id=${encodeURIComponent(companyId)}`), {
        method: 'DELETE', headers: getApiRequestHeaders(),
      }, 'Revisão arquivada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao arquivar.');
    } finally { setBusy(null); }
  };

  const reorder = async (slideIds: number[]) => {
    if (!data) return;
    setBusy('reorder');
    try {
      await request(api(`/reorder?company_id=${encodeURIComponent(companyId)}`), {
        method: 'PATCH',
        headers: {
          ...getApiRequestHeaders(),
          'Content-Type': 'application/json',
          'If-Match': data.public_version,
        },
        body: JSON.stringify({ slide_ids: slideIds }),
      }, 'Ordem de exibição atualizada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível reordenar.');
    } finally { setBusy(null); }
  };

  const published = (data?.slides || []).filter((slide) => slide.status === 'published')
    .sort((a, b) => a.position - b.position);
  const move = (index: number, delta: number) => {
    const next = published.map((slide) => slide.id);
    const other = index + delta;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other], next[index]];
    void reorder(next);
  };

  return (
    <div data-testid="brand-hero-manager" className="space-y-3">
      <p className="text-xs leading-5 text-slate-500">
        Até 3 imagens institucionais, sem alterar o tamanho do banner da Brand Page.
        Formatos PNG, JPG ou WebP (até 5 MB; recomendado 1920×600).
      </p>
      {loading ? <p className="text-sm text-slate-500">Consultando banners...</p> : null}
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p role="status" className="rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{message}</p> : null}

      {data && !data.enabled ? (
        <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
          Carrossel indisponível neste momento. A configuração exige um plano pago habilitado e a liberação do recurso.
          Nenhuma imagem existente será apagada.
        </div>
      ) : null}

      {data?.enabled ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[1, 2, 3].map((slot) => {
              const active = (data.slides || []).find((slide) => slide.slot === slot && slide.status === 'published');
              const candidate = (data.slides || []).find(
                (slide) => slide.slot === slot && ['draft', 'pending_review', 'rejected', 'approved'].includes(slide.status)
              );
              const preview = candidate || active;
              return (
                <div key={slot} className="min-w-0 rounded-lg border border-slate-200 p-3" data-testid={`brand-hero-slot-${slot}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">Banner {slot}</span>
                    <span className="text-[11px] text-slate-500">{preview ? STATUS[preview.status] : 'Vazio'}</span>
                  </div>
                  <div className="w-full overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                    {preview?.image_url && preview.width && preview.height ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getFullImageUrl(preview.image_url)} alt={preview.alt_text || `Banner ${slot}`} className="block h-auto w-full" />
                    ) : (
                      <div className="flex min-h-20 items-center justify-center text-xs text-slate-400">Sem imagem</div>
                    )}
                  </div>
                  {active && candidate ? <p className="mt-1 text-[11px] text-slate-500">A versão publicada continua disponível.</p> : null}
                  {candidate?.rejection_reason ? <p className="mt-1 text-xs text-red-700">{candidate.rejection_reason}</p> : null}
                  <label className="mt-3 block text-xs font-medium text-slate-700">
                    Descrição da imagem
                    <input
                      maxLength={160}
                      value={altTexts[slot] ?? candidate?.alt_text ?? active?.alt_text ?? ''}
                      onChange={(e) => setAltTexts((prev) => ({ ...prev, [slot]: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-slate-200 p-2 text-xs"
                    />
                  </label>
                  <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700">
                    <ImagePlus aria-hidden="true" className="h-4 w-4" />
                    {busy === `upload-${slot}` ? 'Enviando...' : 'Enviar nova imagem'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                      disabled={busy !== null} onChange={(e) => {
                        void upload(slot, e.target.files?.[0]);
                        e.target.value = '';
                      }} />
                  </label>
                  {candidate && ['draft', 'rejected'].includes(candidate.status) ? (
                    <button type="button" disabled={busy !== null} onClick={() => void submit(candidate)}
                      className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-2 text-xs font-semibold text-white disabled:opacity-40">
                      <Send aria-hidden="true" className="h-3.5 w-3.5" /> Enviar para aprovação
                    </button>
                  ) : null}
                  {candidate && candidate.status !== 'published' ? (
                    <button type="button" disabled={busy !== null} onClick={() => void archive(candidate)}
                      className="mt-1 flex min-h-10 w-full items-center justify-center gap-2 rounded-md text-xs text-slate-600 disabled:opacity-40">
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Arquivar revisão
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {published.length > 1 ? (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Ordem pública dos banners</p>
              {published.map((slide, index) => (
                <div key={slide.id} className="flex items-center justify-between gap-3 text-xs">
                  <span>{index + 1}. Banner {slide.slot}</span>
                  <div className="flex gap-2">
                    <button type="button" aria-label={`Mover banner ${slide.slot} para esquerda`}
                      disabled={index === 0 || busy !== null} onClick={() => move(index, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-md border disabled:opacity-30">
                      <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Mover banner ${slide.slot} para direita`}
                      disabled={index === published.length - 1 || busy !== null} onClick={() => move(index, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-md border disabled:opacity-30">
                      <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        legacyBannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getFullImageUrl(legacyBannerUrl)} alt={`Banner atual de ${companyName}`} className="block h-auto w-full rounded-lg" />
        ) : null
      )}
    </div>
  );
}
