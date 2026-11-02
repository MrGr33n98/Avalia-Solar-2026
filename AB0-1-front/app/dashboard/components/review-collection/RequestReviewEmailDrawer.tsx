'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  EMAIL_TEMPLATE_PRESETS,
  EmailTemplateKey,
  renderEmailTemplate,
  buildComposeUrls,
} from './reviewEmailTemplates';
import { buildPublicReviewUrl, formatShortDisplayUrl } from '@/lib/review-forms/urls';
import {
  Mail,
  Copy,
  ExternalLink,
  Check,
  Send,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface RequestReviewEmailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formName: string;
  formToken: string;
  companyName: string;
  onTrack?: (event: string, meta?: Record<string, unknown>) => void;
}

export function RequestReviewEmailDrawer({
  open,
  onOpenChange,
  formName,
  formToken,
  companyName,
  onTrack,
}: RequestReviewEmailDrawerProps) {
  const { toast } = useToast();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<EmailTemplateKey>('general');
  const [clientName, setClientName] = useState('');
  const [copiedField, setCopiedField] = useState<'subject' | 'body' | 'link' | null>(null);

  // Link público canônico do canal de e-mail
  const reviewLink = buildPublicReviewUrl(formToken, 'email');
  const shortReviewLink = formatShortDisplayUrl(reviewLink);

  const rendered = renderEmailTemplate({
    templateKey: selectedTemplateKey,
    companyName: companyName || 'Avalia Solar',
    clientName,
    reviewLink,
  });

  const composeUrls = buildComposeUrls(rendered.subject, rendered.body);

  const handleCopy = async (field: 'subject' | 'body' | 'link') => {
    let textToCopy = '';
    if (field === 'subject') textToCopy = rendered.subject;
    if (field === 'body') textToCopy = rendered.body;
    if (field === 'link') textToCopy = reviewLink;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedField(field);
      toast({
        title:
          field === 'subject'
            ? 'Assunto copiado!'
            : field === 'body'
            ? 'Mensagem completa copiada!'
            : 'Link de avaliação copiado!',
        description: 'Cole no seu provedor de e-mail favorito.',
      });
      onTrack?.('email_template_copied', { field, template: selectedTemplateKey });
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      toast({
        title: 'Falha ao copiar',
        description: 'Selecione o texto manualmente.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenCompose = (client: 'gmail' | 'outlook' | 'mailto') => {
    const url = composeUrls[client];

    if (client === 'mailto') {
      window.location.href = url;
      onTrack?.('draft_opened', { client: 'mailto', template: selectedTemplateKey });
      return;
    }

    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      toast({
        title: 'Pop-up bloqueado',
        description:
          'Seu navegador bloqueou a nova aba. Autorize pop-ups ou clique em App de E-mail (mailto).',
        variant: 'destructive',
      });
      // Fallback para mailto caso pop-up tenha sido interceptado
      window.location.href = composeUrls.mailto;
    }

    onTrack?.('draft_opened', { client, template: selectedTemplateKey });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-6 bg-slate-50 flex flex-col justify-between"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-1 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] font-bold uppercase tracking-wider">
                Solicitação Direta
              </Badge>
              <span className="text-xs text-slate-500 font-medium">Formulário: {formName}</span>
            </div>
            <SheetTitle className="text-xl font-black text-slate-950 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Solicitar Avaliação por E-mail
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-600">
              Escolha um modelo calibrado, personalize com o nome do cliente e abra o rascunho
              diretamente no seu provedor habitual.
            </SheetDescription>
          </SheetHeader>

          {/* Seleção do Template */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              1. Escolha o contexto do e-mail
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EMAIL_TEMPLATE_PRESETS.map((preset) => {
                const isSelected = selectedTemplateKey === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(preset.key)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-white ring-2 ring-blue-100 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                      {preset.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customização: Nome do Cliente */}
          <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
            <label
              htmlFor="client-name-input"
              className="text-xs font-bold text-slate-800 flex items-center justify-between"
            >
              <span>Nome do cliente (opcional)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Deixe em branco para envio genérico
              </span>
            </label>
            <Input
              id="client-name-input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
              className="h-9 text-xs border-slate-200 focus-visible:ring-blue-500"
            />
          </div>

          {/* Preview do E-mail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Prévia do E-mail
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy('subject')}
                  className="h-7 px-2 text-[11px] font-semibold text-slate-600 hover:text-blue-700"
                >
                  {copiedField === 'subject' ? (
                    <Check className="h-3 w-3 mr-1 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copiar Assunto
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy('body')}
                  className="h-7 px-2 text-[11px] font-semibold text-slate-600 hover:text-blue-700"
                >
                  {copiedField === 'body' ? (
                    <Check className="h-3 w-3 mr-1 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copiar Corpo
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-3 shadow-inner">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold mr-2">Assunto:</span>
                <span className="font-bold text-slate-900">{rendered.subject}</span>
              </div>
              <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[12px] max-h-56 overflow-y-auto">
                {rendered.body}
              </div>
            </div>
          </div>

          {/* Banner de Conformidade & Segurança */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Privacidade garantida:</strong> este fluxo gera o rascunho de e-mail no seu
              próprio cliente de e-mail. Nenhum dado ou mensagem transita por servidores de terceiros
              nesta etapa.
            </p>
          </div>
        </div>

        {/* Footer com Ações de Abertura Externa */}
        <div className="mt-8 pt-4 border-t border-slate-200 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            3. Abrir rascunho pronto
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              type="button"
              onClick={() => handleOpenCompose('gmail')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 shadow-sm"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Abrir no Gmail
            </Button>
            <Button
              type="button"
              onClick={() => handleOpenCompose('outlook')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs h-10 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Abrir no Outlook
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenCompose('mailto')}
              className="border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs h-10"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              App Padrão
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

