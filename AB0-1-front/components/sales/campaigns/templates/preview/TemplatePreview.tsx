'use client';

import { useState } from 'react';
import type { TemplatePreviewResult } from '../types';
import { TemplateDeviceToggle } from './TemplateDeviceToggle';
import { Button } from '@/components/ui/button';
import { X, Send } from 'lucide-react';

interface TemplatePreviewProps {
  preview: TemplatePreviewResult;
  contextMode?: 'sample' | 'real';
  onClose: () => void;
  onOpenTestSend?: () => void;
}

export function TemplatePreview({ preview, contextMode = 'sample', onClose, onOpenTestSend }: TemplatePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https: http:; font-src https:;">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; line-height: 1.5; background-color: #ffffff; }
          a { color: #2563eb; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${preview.body_html}
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-xl border overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4 bg-card">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base line-clamp-1">Prévia: {preview.subject}</h3>
              {contextMode === 'sample' && (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                  Dados de demonstração
                </span>
              )}
            </div>
            {preview.preheader && (
              <p className="text-xs text-muted-foreground line-clamp-1 italic">
                Preheader: {preview.preheader}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <TemplateDeviceToggle device={device} onChange={setDevice} />

            {onOpenTestSend && (
              <Button size="sm" variant="outline" onClick={onOpenTestSend} className="gap-1.5 h-8 text-xs">
                <Send className="h-3.5 w-3.5" />
                Enviar teste
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Fechar prévia" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-muted/40 p-6 overflow-y-auto flex justify-center items-start">
          <div
            className={`bg-background rounded-md shadow-md border overflow-hidden transition-all duration-300 ${
              device === 'mobile' ? 'w-[375px] min-h-[600px]' : 'w-full max-w-[700px] min-h-[500px]'
            }`}
          >
            <iframe
              title="Prévia do e-mail"
              sandbox="allow-same-origin"
              referrerPolicy="no-referrer"
              srcDoc={srcDoc}
              className="w-full h-[600px] border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
