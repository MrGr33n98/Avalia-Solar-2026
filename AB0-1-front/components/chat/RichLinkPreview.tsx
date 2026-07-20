'use client';

import React, { useMemo } from 'react';
import { ExternalLink, ShieldCheck, FileText, Building2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichLinkPreviewProps {
  text: string;
  isSelf?: boolean;
  className?: string;
}

interface LinkInfo {
  url: string;
  domain: string;
  title: string;
  description: string;
  type: 'company' | 'product' | 'form' | 'external';
  image?: string;
}

export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

export function parseLinkInfo(urlStr: string): LinkInfo {
  try {
    const parsed = new URL(urlStr);
    const domain = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname;

    // Links Internos Avalia Solar
    if (domain.includes('avaliasolar.com.br') || domain === 'localhost') {
      if (pathname.includes('/companies/')) {
        const companySlug = pathname.split('/companies/')[1]?.split('/')[0] || '';
        const formattedName = companySlug.replace(/-/g, ' ').toUpperCase();
        return {
          url: urlStr,
          domain: 'avaliasolar.com.br',
          title: `Empresa Verificada: ${formattedName}`,
          description: 'Perfil oficial com avaliações, catálogo de produtos e orçamentos diretos.',
          type: 'company',
          image: '/images/avalia-solar-place-holder.PNG',
        };
      }

      if (pathname.includes('/categories/')) {
        const categorySlug = pathname.split('/categories/')[1] || '';
        const formattedCat = categorySlug.replace(/-/g, ' ').toUpperCase();
        return {
          url: urlStr,
          domain: 'avaliasolar.com.br',
          title: `Catálogo: ${formattedCat}`,
          description: 'Compare especificações técnicas, preços e instaladores credenciados.',
          type: 'product',
        };
      }
    }

    // Links de Formulários de Cotação (Tally, Typeform, Google Forms, etc.)
    if (domain.includes('tally.so') || domain.includes('typeform.com') || domain.includes('forms')) {
      return {
        url: urlStr,
        domain: domain,
        title: 'Formulário de Pré-Dimensionamento & Orçamento',
        description: 'Preencha os dados da sua fatura para receber propostas personalizadas.',
        type: 'form',
      };
    }

    // Genérico Externo
    return {
      url: urlStr,
      domain: domain,
      title: `Link Externo (${domain})`,
      description: 'Clique para abrir o link compartilhado em uma nova guia segura.',
      type: 'external',
    };
  } catch {
    return {
      url: urlStr,
      domain: 'link',
      title: 'Link compartilhado',
      description: urlStr,
      type: 'external',
    };
  }
}

export function RichLinkPreview({ text, isSelf = false, className }: RichLinkPreviewProps) {
  const url = useMemo(() => extractFirstUrl(text), [text]);

  if (!url) return null;

  const info = useMemo(() => parseLinkInfo(url), [url]);

  return (
    <div className={cn('mt-2.5 overflow-hidden rounded-xl border transition-all', className)}>
      <a
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group flex flex-col p-3 transition-colors',
          isSelf
            ? 'bg-black/10 hover:bg-black/20 text-white border-white/20'
            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
        )}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider opacity-80 uppercase mb-1">
          {info.type === 'company' && <Building2 className="h-3.5 w-3.5 text-blue-500" />}
          {info.type === 'form' && <FileText className="h-3.5 w-3.5 text-emerald-500" />}
          {info.type === 'product' && <Zap className="h-3.5 w-3.5 text-amber-500" />}
          {info.type === 'external' && <ExternalLink className="h-3.5 w-3.5" />}
          <span>{info.domain}</span>
          <span title="Link seguro e verificado" className="ml-auto">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
          </span>
        </div>

        <h4 className="text-xs font-bold leading-snug line-clamp-1 group-hover:underline">
          {info.title}
        </h4>

        <p className={cn('mt-1 text-[11px] leading-relaxed line-clamp-2', isSelf ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400')}>
          {info.description}
        </p>

        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 group-hover:text-blue-600">
          <span>Abrir link</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </a>
    </div>
  );
}
