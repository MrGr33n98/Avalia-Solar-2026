'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { buildPublicReviewUrl } from '@/lib/review-forms/urls';
import { buildApiUrl } from '@/lib/api-config';

export interface ShareableReviewForm {
  id: number;
  name: string;
  token: string;
  status: 'active' | 'inactive';
  settings?: { whatsapp_message?: string };
}

interface ReviewShareCardProps {
  form: ShareableReviewForm;
  companyName: string;
  onOpenEmailDrawer: () => void;
  onTrack?: (event: string, meta?: Record<string, unknown>) => void;
}

const ICON_SPRITE = '/assets/icons/review-collection/avalia-solar-icons-sprite.svg';

function ActionIcon({ name, size = 19, inverse = false }: { name: string; size?: number; inverse?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={inverse ? 'shrink-0 brightness-0 invert' : 'shrink-0'}>
      <use href={ICON_SPRITE + '#' + name} />
    </svg>
  );
}

/**
 * Ações de coleta: link + e-mail prioritários; WhatsApp e QR como alternativas.
 * Copiar/abrir WhatsApp NÃO equivale a convite entregue nem a avaliação enviada.
 */
export function ReviewShareCard({ form, companyName, onOpenEmailDrawer, onTrack }: ReviewShareCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = form.status === 'active';
  const directLinkUrl = buildPublicReviewUrl(form.token, 'link');
  const whatsappReviewLink = buildPublicReviewUrl(form.token, 'whatsapp');
  const qrDownloadUrl = buildApiUrl('/review_forms/' + encodeURIComponent(form.token) + '/qr_code') + '?download=1';
  const defaultMessage = 'Olá! Você poderia avaliar sua experiência com a ' + companyName +
    ' no Avalia Solar? Sua opinião é importante: ' + whatsappReviewLink;
  const whatsappMessage = form.settings?.whatsapp_message
    ? form.settings.whatsapp_message.replaceAll('{{review_form_link}}', whatsappReviewLink)
    : defaultMessage;
  const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(whatsappMessage);

  useEffect(() => () => { if (resetTimeout.current) clearTimeout(resetTimeout.current); }, []);

  const copyDirectLink = async () => {
    if (!isActive) return;
    try {
      await navigator.clipboard.writeText(directLinkUrl);
      setCopied(true);
      onTrack?.('link_copied', { channel: 'link', form_token: form.token });
      toast({ title: 'Link copiado', description: 'Compartilhe com clientes que utilizaram seus serviços.' });
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      resetTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Não foi possível copiar o link', variant: 'destructive' });
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-[#DEE5F5] bg-[#F1F3FD] shadow-sm" data-testid="review-share-card">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#0A1F44]">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white">
              <ActionIcon name="11_elo" size={22} />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-5 text-[#0A1F44] sm:text-lg">
              Compartilhe seu link de avaliação diretamente
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Envie este link por e-mail, WhatsApp e outros canais para solicitar opiniões autênticas.
            </p>
          </div>
        </div>

        {!isActive && (
          <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Este formulário está inativo no momento. Ative-o para compartilhar ou baixar o QR Code.
          </p>
        )}

        <div className="rounded-xl border border-white bg-white p-2.5 shadow-sm sm:p-3">
          <label htmlFor="review-public-link" className="mb-1 block text-[11px] font-semibold text-slate-600">
            Link Direto · {form.name}
          </label>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <input
              id="review-public-link"
              data-testid="review-public-link"
              type="text"
              value={directLinkUrl}
              readOnly
              aria-label="Link público do formulário de avaliação"
              className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#0A1F44] outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:text-sm"
            />
            <Button type="button" onClick={() => { void copyDirectLink(); }} disabled={!isActive}
              className="h-11 w-full gap-2 rounded-lg bg-[#0B5FFF] px-4 text-sm font-semibold text-white hover:bg-[#084BD0] sm:w-auto">
              <ActionIcon name="12_copiar" size={19} inverse />
              {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <Button type="button" variant="outline" disabled={!isActive}
              onClick={onOpenEmailDrawer}
              className="h-11 w-full gap-2 rounded-lg border-slate-300 px-3 text-sm font-semibold text-[#0A1F44] hover:bg-slate-50 sm:w-auto">
              Solicitar via e-mail
              <ActionIcon name="13_seta_direita" size={16} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isActive ? (
            <>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => onTrack?.('whatsapp_clicked', { channel: 'whatsapp', form_token: form.token })}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                WhatsApp
              </a>
              <a href={qrDownloadUrl} download
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-[#0A1F44] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                QR Code · Baixar PNG
              </a>
            </>
          ) : (
            <span className="text-slate-600">WhatsApp e QR Code indisponíveis enquanto o formulário estiver pausado.</span>
          )}
          <span className="ml-auto text-[11px] text-slate-500">Ações de compartilhamento não representam envios concluídos.</span>
        </div>
      </CardContent>
    </Card>
  );
}
