'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { buildPublicReviewUrl } from '@/lib/review-forms/urls';
import { Code2, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface ReviewButtonEmbedProps {
  formToken: string;
  companyName: string;
  isActive?: boolean;
  onTrack?: (event: string, meta?: Record<string, unknown>) => void;
}

export function ReviewButtonEmbed({ formToken, companyName, isActive = true, onTrack }: ReviewButtonEmbedProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'blue' | 'dark' | 'outline'>('blue');

  const widgetUrl = buildPublicReviewUrl(formToken, 'widget');
  const safeCompany = companyName?.trim() || 'Avalia Solar';
  // Código exportado como HTML para outro domínio: escape contextual obrigatório.
  const htmlEntities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  const escapedCompany = safeCompany.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);

  const themeStyles = {
    blue: 'background-color:#2563eb;color:#ffffff;border:none;',
    dark: 'background-color:#0f172a;color:#ffffff;border:none;',
    outline: 'background-color:#ffffff;color:#2563eb;border:1.5px solid #2563eb;',
  };

  const snippetHtml = `<!-- Avalia Solar Review Button -->
<a href="${widgetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.1);${themeStyles[theme]}transition:all 0.2s ease;">
  <span style="color:#f59e0b;font-size:16px;">★</span>
  <span>Avalie a ${escapedCompany} no Avalia Solar</span>
</a>`;

  const handleCopy = async () => {
    if (!isActive) return;
    try {
      await navigator.clipboard.writeText(snippetHtml);
      setCopied(true);
      toast({
        title: 'Código HTML copiado!',
        description: 'Cole o snippet no rodapé ou página de contato do seu site.',
      });
      onTrack?.('widget_snippet_copied', { theme, form_token: formToken });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione o código manualmente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden border">
      <CardContent className="p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5 text-blue-600" />
                Widget para seu Site (QW-07)
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-extrabold uppercase rounded-full px-2 py-0.5 border-slate-200 bg-slate-50 text-slate-700"
              >
                HTML Estático
              </Badge>
            </div>
            <h3 className="text-base font-black text-slate-950">
              Botão de Avaliação para Sites Externos
            </h3>
            <p className="text-xs text-slate-500">
              Incorpore um botão leve e seguro no seu site que direciona clientes diretamente para a
              coleta com rastreio de origem <code>source=widget</code>.
            </p>
          </div>

          {/* Seletor de Tema do Botão */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(
              [
                ['blue', 'Azul'],
                ['dark', 'Escuro'],
                ['outline', 'Borda'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  theme === key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Prévia do Botão e Código lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Prévia Interativa */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3 min-h-[140px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Prévia Visual
            </span>
            <a
              href={isActive ? widgetUrl : undefined}
              aria-disabled={!isActive}
              tabIndex={isActive ? 0 : -1}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                theme === 'blue'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : theme === 'dark'
                  ? 'bg-slate-900 hover:bg-black text-white'
                  : 'bg-white hover:bg-slate-50 text-blue-700 border border-blue-600'
              }`}
            >
              <span className="text-amber-400 text-sm">★</span>
              <span>Avalie a {safeCompany} no Avalia Solar</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>

          {/* Snippet com Copiar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 font-mono">HTML Snippet</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!isActive}
                className="h-7 text-xs font-bold border-slate-300"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar Código
                  </>
                )}
              </Button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-32 border border-slate-800 leading-relaxed">
              <code>{isActive ? snippetHtml : 'Formulário pausado. Ative-o para liberar o código.'}</code>
            </pre>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Snippet livre de dependências JavaScript ou cookies de rastreamento invasivos.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

