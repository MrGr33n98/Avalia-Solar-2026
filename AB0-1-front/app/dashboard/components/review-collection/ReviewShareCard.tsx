'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { buildPublicReviewUrl, formatShortDisplayUrl } from '@/lib/review-forms/urls';
import { buildApiUrl } from '@/lib/api-config';
import {
  Link as LinkIcon,
  MessageCircle,
  Download,
  Mail,
  Check,
  Copy,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export interface ShareableReviewForm {
  id: number;
  name: string;
  token: string;
  status: 'active' | 'inactive';
  settings?: {
    whatsapp_message?: string;
  };
}

interface ReviewShareCardProps {
  form: ShareableReviewForm;
  companyName: string;
  onOpenEmailDrawer: () => void;
  onTrack?: (event: string, meta?: Record<string, unknown>) => void;
}

export function ReviewShareCard({
  form,
  companyName,
  onOpenEmailDrawer,
  onTrack,
}: ReviewShareCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const isActive = form.status === 'active';

  // URLs por canal
  const directLinkUrl = buildPublicReviewUrl(form.token, 'link');
  const shortDisplay = formatShortDisplayUrl(directLinkUrl);

  const whatsappLink = buildPublicReviewUrl(form.token, 'whatsapp');
  const defaultWhatsAppMsg = `Olá! Poderia avaliar nosso atendimento na Avalia Solar? Leva menos de 2 minutos: ${whatsappLink}`;
  const customWhatsAppMsg = form.settings?.whatsapp_message
    ? form.settings.whatsapp_message.replace('{{review_form_link}}', whatsappLink)
    : defaultWhatsAppMsg;

  const qrDownloadUrl = `${buildApiUrl(`/review_forms/${form.token}/qr_code`)}?download=1`;

  const handleCopyLink = async () => {
    if (!isActive) return;
    try {
      await navigator.clipboard.writeText(directLinkUrl);
      setCopied(true);
      toast({
        title: 'Link copiado com sucesso!',
        description: 'Compartilhe com seus clientes para coletar avaliações.',
      });
      onTrack?.('link_copied', { channel: 'link', form_token: form.token });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar para a área de transferência.',
        variant: 'destructive',
      });
    }
  };

  const handleWhatsAppClick = () => {
    if (!isActive) return;
    onTrack?.('whatsapp_clicked', { channel: 'whatsapp', form_token: form.token });
  };

  const handleQrDownload = () => {
    if (!isActive) return;
    onTrack?.('qr_downloaded', { channel: 'qr', form_token: form.token });
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden border">
      <CardContent className="p-5 md:p-6 space-y-5">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                Ações Rápidas de Coleta
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] font-extrabold uppercase rounded-full px-2 py-0.5 ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-500'
                }`}
              >
                {isActive ? 'Formulário Ativo' : 'Pausado'}
              </Badge>
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-950">{form.name}</h3>
          </div>

          {/* Link encurtado com botão rápido de cópia */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-mono font-medium text-slate-600 truncate max-w-[200px]">
              {shortDisplay}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!isActive}
              onClick={handleCopyLink}
              className="h-6 w-6 text-slate-500 hover:text-blue-700"
              title="Copiar link direto"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Alerta de Formulário Inativo */}
        {!isActive && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Este formulário está inativo no momento. Ative-o na lista abaixo para habilitar o
              compartilhamento público.
            </span>
          </div>
        )}

        {/* Grade de 4 Ações Rápidas por Canal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Copiar Link Direto */}
          <div className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-700">
                <LinkIcon className="h-4 w-4" />
                <span className="text-xs font-bold text-slate-900">Link Direto</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ideal para colar em mensagens privadas, chats e propostas.
              </p>
            </div>
            <Button
              type="button"
              variant={copied ? 'outline' : 'default'}
              disabled={!isActive}
              onClick={handleCopyLink}
              className={`w-full text-xs font-bold h-8.5 rounded-lg ${
                copied
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copiar Link
                </>
              )}
            </Button>
          </div>

          {/* 2. Compartilhar no WhatsApp */}
          <div className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs font-bold text-slate-900">WhatsApp</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mensagem pronta com link para envio rápido pelo WhatsApp.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={!isActive}
              asChild={isActive}
              className="w-full text-xs font-bold h-8.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {isActive ? (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(customWhatsAppMsg)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleWhatsAppClick}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Enviar WhatsApp
                </a>
              ) : (
                <span>Indisponível</span>
              )}
            </Button>
          </div>

          {/* 3. Solicitar por E-mail (Abre Drawer) */}
          <div className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600">
                <Mail className="h-4 w-4" />
                <span className="text-xs font-bold text-slate-900">Via E-mail</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Rascunhos prontos para Gmail, Outlook ou app padrão.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!isActive}
              onClick={onOpenEmailDrawer}
              className="w-full text-xs font-bold h-8.5 rounded-lg border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1 text-indigo-600" />
              Solicitar por E-mail
            </Button>
          </div>

          {/* 4. Baixar QR Code */}
          <div className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-700">
                <Download className="h-4 w-4" />
                <span className="text-xs font-bold text-slate-900">QR Code</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Para imprimir em cartões de visita, banners e veículos.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={!isActive}
              asChild={isActive}
              className="w-full text-xs font-bold h-8.5 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              {isActive ? (
                <a href={qrDownloadUrl} download onClick={handleQrDownload}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Baixar PNG
                </a>
              ) : (
                <span>Indisponível</span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
