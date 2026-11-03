'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArticleHtmlRenderer } from '@/components/blog/ArticleHtmlRenderer';
import {
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Eye,
} from 'lucide-react';

type ViewportMode = 'mobile-narrow' | 'mobile' | 'tablet' | 'desktop';

export default function ArticlePreviewPage() {
  const [content, setContent] = useState<string>('');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Attempt to load preview content from sessionStorage (stored by ActiveAdmin Article Studio)
    try {
      const stored = window.sessionStorage.getItem('as_article_draft_preview');
      if (stored) {
        setContent(stored);
      } else {
        setContent(
          `<h2>Bem-vindo ao Article Studio A+++</h2>
          <p>Este é o ambiente de pré-visualização editorial isolado e seguro.</p>
          <div class="as-cta-card" data-as-component="cta" data-as-component-id="preview-demo">
            <h2 class="as-cta-title">Sua empresa pode ser referência na região.</h2>
            <p class="as-cta-description">Conheça a apresentação do Plano Founder.</p>
            <a class="as-btn as-btn--primary" href="/founder" data-as-track="cta_click">
              Conhecer o Plano Founder →
            </a>
          </div>`
        );
      }
    } catch {
      // Fallback
    } finally {
      setLoaded(true);
    }
  }, []);

  // Quality gate checks based on Article validations
  const hasH2 = /<h2\b[^>]*>/i.test(content);
  const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const hasComponents = /as-cta-card|as-info-card|as-callout|as-banner|as-table-wrap/.test(content);

  const getViewportWidth = (): string => {
    switch (viewport) {
      case 'mobile-narrow':
        return '360px';
      case 'mobile':
        return '390px';
      case 'tablet':
        return '768px';
      case 'desktop':
      default:
        return '100%';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar with Quality Gates & Viewport Controls */}
      <header className="sticky top-0 z-50 bg-slate-800/95 border-b border-slate-700 px-4 py-3 backdrop-blur flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Blog
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Eye className="w-3.5 h-3.5" /> PRÉVIA EDITORIAL (NOINDEX)
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-700/80">
          <button
            type="button"
            onClick={() => setViewport('mobile-narrow')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-all ${
              viewport === 'mobile-narrow'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="360px (Mobile Compacto)"
          >
            <Smartphone className="w-3 h-3" /> 360px
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-all ${
              viewport === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="390px (Mobile Padrão)"
          >
            <Smartphone className="w-3.5 h-3.5" /> 390px
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-all ${
              viewport === 'tablet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="768px (Tablet)"
          >
            <Tablet className="w-3.5 h-3.5" /> 768px
          </button>
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-all ${
              viewport === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="100% (Desktop)"
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
        </div>

        {/* Quality Gates Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded ${
              hasH2 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}
          >
            {hasH2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>H2 Subtítulo {hasH2 ? 'OK' : 'Ausente'}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-blue-400 bg-blue-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{hasComponents ? 'Componentes .as-*' : 'Texto Simples'}</span>
          </div>

          <span className="text-slate-400">{wordCount} palavras</span>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 p-4 md:p-8 flex justify-center items-start overflow-y-auto">
        <div
          style={{ width: getViewportWidth() }}
          className="transition-all duration-300 ease-out bg-white text-slate-900 rounded-xl shadow-2xl p-6 md:p-10 border border-slate-200 overflow-hidden"
        >
          {loaded && <ArticleHtmlRenderer content={content} />}
        </div>
      </main>
    </div>
  );
}
