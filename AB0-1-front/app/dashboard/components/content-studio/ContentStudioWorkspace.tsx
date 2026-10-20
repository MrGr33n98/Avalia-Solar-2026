'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  ShieldCheck,
  Star,
  Copy,
  Check,
  Download,
  Code2,
  ExternalLink,
  Sparkles,
  FileText,
  Palette,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Printer,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import WidgetBadge from '../WidgetBadge';

interface CompanyData {
  id?: string | number;
  name?: string;
  slug?: string;
  verified?: boolean;
  trust_score?: number;
  rating_avg?: number;
  reviews_count?: number;
  logo_url?: string;
  verified_badge_image_url?: string;
  public_profile_url?: string;
  api_key?: string;
}

interface ContentStudioWorkspaceProps {
  company: CompanyData | null;
  companyId?: string | number;
}

type ContentStudioTab = 'badges' | 'widgets' | 'reports';
type BadgeType = 'recommended_2026' | 'verified_integrator' | 'top_reviews' | 'top_performer';
type WidgetStyle = 'default' | 'compact' | 'circular' | 'split';

export default function ContentStudioWorkspace({
  company,
  companyId,
}: ContentStudioWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ContentStudioTab>('badges');

  // Estado da Aba 1: Selos Oficiais
  const [selectedBadge, setSelectedBadge] = useState<BadgeType>('recommended_2026');
  const [badgeTheme, setBadgeTheme] = useState<'light' | 'dark'>('dark');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Estado da Aba 2: Widget Interativo
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>('default');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('dark');
  const [showRating, setShowRating] = useState(true);
  const [showReviewsCount, setShowReviewsCount] = useState(true);
  const [showTrustScore, setShowTrustScore] = useState(true);
  const [showRank, setShowRank] = useState(true);
  const highlightColor = '#2563EB';
  const [widgetIntegrationTab, setWidgetIntegrationTab] = useState<'html' | 'js' | 'iframe'>('html');

  const resolvedCompanyId = String(company?.id || companyId || '1772');
  const companyName = company?.name || 'Sua Empresa Solar';
  const companySlug = company?.slug || `empresa-${resolvedCompanyId}`;
  const trustScore = company?.trust_score ?? 94;
  const ratingAvg = Number(company?.rating_avg) || 4.9;
  const reviewsCount = company?.reviews_count ?? 38;

  const publicProfileUrl = `https://avaliasolar.com.br/empresa/${companySlug}`;
  const trackedProfileUrl = `${publicProfileUrl}?utm_source=trust_badge&utm_medium=embed&utm_campaign=selo_2026`;

  // Dados para o preview do WidgetBadge
  const previewCompanyData = useMemo(() => {
    return {
      name: companyName,
      verified: company?.verified ?? true,
      trust_score: trustScore,
      rating_avg: ratingAvg,
      reviews_count: reviewsCount,
      logo_url: company?.logo_url,
      verified_badge_image_url: company?.verified_badge_image_url,
      public_profile_url: trackedProfileUrl,
    };
  }, [company, companyName, trustScore, ratingAvg, reviewsCount, trackedProfileUrl]);

  // Snippets de código do Selo Oficial
  const badgeHtmlSnippet = useMemo(() => {
    return `<!-- Selo Oficial Avalia Solar 2026 -->
<a href="${trackedProfileUrl}" target="_blank" rel="noopener noreferrer" title="${companyName} - Empresa Avaliada no Avalia Solar">
  <div style="display:inline-flex;align-items:center;gap:12px;padding:10px 16px;background:${badgeTheme === 'dark' ? '#00223D' : '#FFFFFF'};border:1px solid ${badgeTheme === 'dark' ? '#004080' : '#E2E8F0'};border-radius:14px;font-family:system-ui,-apple-system,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.08);color:${badgeTheme === 'dark' ? '#FFFFFF' : '#0F172A'};">
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:10px;color:#fff;font-size:18px;">
      ☀️
    </div>
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#F59E0B;">
        ${selectedBadge === 'recommended_2026' ? 'Empresa Recomendada' : selectedBadge === 'verified_integrator' ? 'Integrador Verificado' : selectedBadge === 'top_reviews' ? 'Líder em Avaliações' : 'Top Performance'} 2026
      </div>
      <div style="font-size:13px;font-weight:700;line-height:1.2;">
        ${companyName}
      </div>
      <div style="font-size:10px;color:${badgeTheme === 'dark' ? '#94A3B8' : '#64748B'};display:flex;align-items:center;gap:4px;margin-top:2px;">
        <span>★ ${ratingAvg.toFixed(1)}</span> · <span>Trust Score: ${trustScore}%</span> · <span style="text-decoration:underline;">avaliasolar.com.br</span>
      </div>
    </div>
  </div>
</a>`;
  }, [trackedProfileUrl, companyName, badgeTheme, selectedBadge, ratingAvg, trustScore]);

  const badgeReactSnippet = useMemo(() => {
    return `// Componente Selo Oficial Avalia Solar 2026 (Next.js / React)
import Link from 'next/link';

export function AvaliaSolarSeal() {
  return (
    <Link
      href="${trackedProfileUrl}"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:scale-[1.02] ${
        badgeTheme === 'dark'
          ? 'bg-[#00223D] border-[#004080] text-white shadow-lg'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-sm">
        ☀️
      </div>
      <div>
        <span className="text-[10px] font-black tracking-wider uppercase text-amber-500 block">
          ${selectedBadge === 'recommended_2026' ? 'Empresa Recomendada 2026' : selectedBadge === 'verified_integrator' ? 'Integrador Verificado' : 'Líder em Avaliações'}
        </span>
        <h4 className="text-xs font-extrabold leading-tight">${companyName}</h4>
        <p className="text-[10px] text-slate-400 mt-0.5">
          ★ ${ratingAvg.toFixed(1)} · Trust Score ${trustScore}% · Avalia Solar
        </p>
      </div>
    </Link>
  );
}`;
  }, [trackedProfileUrl, companyName, badgeTheme, selectedBadge, ratingAvg, trustScore]);

  // Snippets do Widget Interativo
  const widgetJsSnippet = `<div id="avaliasolar-trust-widget"
  data-company-id="${resolvedCompanyId}"
  data-company-slug="${companySlug}"
  data-theme="${widgetTheme}"
  data-style="${widgetStyle}"
  data-lang="pt-BR"
></div>
<script src="https://api.avaliasolar.com.br/api/v1/trust-widget-embed.js" async></script>`;

  const widgetIframeSnippet = `<iframe
  src="https://api.avaliasolar.com.br/api/v1/trust-widget?company_id=${resolvedCompanyId}&theme=${widgetTheme}&style=${widgetStyle}"
  width="100%"
  height="220"
  style="border:none;overflow:hidden;border-radius:16px;"
></iframe>`;

  const copyToClipboard = (text: string, label: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(label);
      toast.success(`${label} copiado para a área de transferência!`);
      setTimeout(() => setCopiedSnippet(null), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Estratégico do Content Studio */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-blue-600 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Content Studio &amp; Marketing Collateral
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Selos de Autoridade &amp; Prova Social
          </h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Destaque a reputação oficial de <strong>{companyName}</strong> no seu site institucional,
            landing pages e propostas. Selos dinâmicos com backlinks rastreáveis que alimentam sua
            inteligência de compradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold py-1 px-3 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Empresa Verificada 2026
          </Badge>
          <Badge variant="outline" className="text-xs font-bold py-1 px-3">
            Trust Score: {trustScore}%
          </Badge>
        </div>
      </div>

      {/* Navegação entre Pilares do Content Studio */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('badges')}
            className={cn(
              'h-10 gap-2 text-xs font-bold rounded-b-none border-b-2 px-4 transition-colors',
              activeTab === 'badges'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 dark:bg-blue-950/20 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
            )}
          >
            <Award className="h-4 w-4 text-amber-500" />
            Selos Oficiais 2026 (Badges &amp; Seals)
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('widgets')}
            className={cn(
              'h-10 gap-2 text-xs font-bold rounded-b-none border-b-2 px-4 transition-colors',
              activeTab === 'widgets'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 dark:bg-blue-950/20 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
            )}
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Widget Interativo de Avaliações
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('reports')}
            className={cn(
              'h-10 gap-2 text-xs font-bold rounded-b-none border-b-2 px-4 transition-colors',
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 dark:bg-blue-950/20 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
            )}
          >
            <FileText className="h-4 w-4 text-emerald-600" />
            Biblioteca de Relatórios &amp; Certificados (G2 Library)
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: SELOS OFICIAIS 2026 (BADGES COM LINK RASTREÁVEL)                  */}
      {/* ========================================================================= */}
      {activeTab === 'badges' && (
        <div className="space-y-8">
          {/* Seletor de Selos Oficiais */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              1. Selecione o Selo Oficial de 2026
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: 'recommended_2026',
                  title: 'Empresa Recomendada 2026',
                  desc: 'Distinção máxima para empresas aprovadas em satisfação e conformidade.',
                  icon: Award,
                  badgeColor: 'from-amber-400 to-amber-600',
                  highlight: 'Oficial 2026',
                },
                {
                  id: 'verified_integrator',
                  title: 'Integrador Verificado 2026',
                  desc: 'Selo de conformidade técnica, ARTs e idoneidade no ecossistema solar.',
                  icon: ShieldCheck,
                  badgeColor: 'from-emerald-400 to-emerald-600',
                  highlight: `Trust ${trustScore}%`,
                },
                {
                  id: 'top_reviews',
                  title: 'Líder em Avaliações',
                  desc: 'Destaque para empresas com média acima de 4.8 estrelas e reviews verificados.',
                  icon: Star,
                  badgeColor: 'from-blue-400 to-blue-600',
                  highlight: `★ ${ratingAvg.toFixed(1)} (${reviewsCount})`,
                },
                {
                  id: 'top_performer',
                  title: 'Top Performance Solar',
                  desc: 'Reconhecimento para líderes de mercado com alto índice de entrega.',
                  icon: TrendingUp,
                  badgeColor: 'from-purple-500 to-indigo-600',
                  highlight: 'Alta Conversão',
                },
              ].map((b) => {
                const Icon = b.icon;
                const isSelected = selectedBadge === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBadge(b.id as BadgeType)}
                    className={cn(
                      'p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-600/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-xs',
                            b.badgeColor
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold',
                            isSelected && 'border-blue-500 text-blue-600 bg-white dark:bg-slate-900'
                          )}
                        >
                          {b.highlight}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {b.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        {b.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                      <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                        {isSelected ? '✓ Selecionado' : 'Selecionar'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: Preview do Selo & Gerador de Código */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Preview do Selo em Tempo Real */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Pré-visualização do Selo
                </h3>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setBadgeTheme('light')}
                    className={cn(
                      'px-2.5 py-1 rounded text-[10px] font-bold transition-all',
                      badgeTheme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeTheme('dark')}
                    className={cn(
                      'px-2.5 py-1 rounded text-[10px] font-bold transition-all',
                      badgeTheme === 'dark'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-white'
                    )}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  'flex items-center justify-center p-8 rounded-2xl border min-h-[220px] transition-colors',
                  badgeTheme === 'dark'
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-100/60 border-slate-200'
                )}
              >
                {/* Renderização Fiel do Selo Oficial */}
                <div
                  className={cn(
                    'inline-flex items-center gap-3.5 p-4 rounded-2xl border shadow-xl transition-all hover:scale-105 cursor-pointer max-w-sm',
                    badgeTheme === 'dark'
                      ? 'bg-[#00223D] border-[#004080] text-white shadow-blue-950/40'
                      : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
                  )}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white font-black text-xl shadow-md">
                    ☀️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black tracking-wider uppercase text-amber-500">
                        {selectedBadge === 'recommended_2026'
                          ? 'Empresa Recomendada 2026'
                          : selectedBadge === 'verified_integrator'
                            ? 'Integrador Verificado 2026'
                            : selectedBadge === 'top_reviews'
                              ? 'Líder em Avaliações'
                              : 'Top Performance 2026'}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold leading-tight mt-0.5">{companyName}</h4>
                    <p
                      className={cn(
                        'text-[11px] mt-1 flex items-center gap-1.5',
                        badgeTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      )}
                    >
                      <span className="text-amber-500 font-bold">★ {ratingAvg.toFixed(1)}</span>
                      <span>·</span>
                      <span>Trust: {trustScore}%</span>
                      <span>·</span>
                      <span className="text-blue-500 font-semibold underline">avaliasolar.com.br</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Informação sobre o Link Rastreável */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                  <Globe className="h-4 w-4" />
                  <span>Backlink Rastreável Ativo:</span>
                </div>
                <p className="text-[11px] break-all text-slate-500 font-mono">
                  {trackedProfileUrl}
                </p>
                <p className="text-[11px] text-blue-800 dark:text-blue-200 pt-1">
                  💡 Todo clique gerado neste selo é registrado e exibido na sua aba de{' '}
                  <strong>Visitantes do Perfil (Profile Signals)</strong>.
                </p>
              </div>
            </div>

            {/* Gerador de Snippet com Opções de Código */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  3. Código de Incorporação para seu Site
                </h3>
                <span className="text-xs text-slate-500 font-medium">Copie e cole no rodapé ou header</span>
              </div>

              {/* Snippet HTML Principal */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Snippet HTML / WordPress (Universal)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(badgeHtmlSnippet, 'HTML Snippet')}
                    className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                  >
                    {copiedSnippet === 'HTML Snippet' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedSnippet === 'HTML Snippet' ? 'Copiado!' : 'Copiar Código'}</span>
                  </Button>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48 border border-slate-800 shadow-inner select-all">
                    {badgeHtmlSnippet}
                  </pre>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Insira este código em qualquer construtor de sites (WordPress, Elementor, Wix,
                  Webflow, RD Station ou HTML puro). O selo se adapta automaticamente à largura do
                  container.
                </p>
              </div>

              {/* Snippet React / Next.js */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Componente React / Next.js
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(badgeReactSnippet, 'React Snippet')}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {copiedSnippet === 'React Snippet' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedSnippet === 'React Snippet' ? 'Copiado!' : 'Copiar TSX'}</span>
                  </Button>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-36 border border-slate-800 shadow-inner select-all">
                    {badgeReactSnippet}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: WIDGET INTERATIVO DE AVALIAÇÕES (LIVE REVIEWS EMBED)              */}
      {/* ========================================================================= */}
      {activeTab === 'widgets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna 1: Controles de Personalização do Widget */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Personalização do Widget Interativo
                </h3>
                <p className="text-xs text-slate-500">
                  Configure o formato e dados exibidos no widget do seu site
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Live Sync v2.4
              </Badge>
            </div>

            {/* Tema */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tema de Exibição
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={widgetTheme === 'light' ? 'default' : 'outline'}
                  onClick={() => setWidgetTheme('light')}
                  className="h-10 text-xs font-bold"
                >
                  Tema Claro (Light)
                </Button>
                <Button
                  type="button"
                  variant={widgetTheme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setWidgetTheme('dark')}
                  className="h-10 text-xs font-bold"
                >
                  Tema Escuro (Dark)
                </Button>
              </div>
            </div>

            {/* Estilo do Widget */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Formato do Widget
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'default', label: 'Padrão' },
                  { id: 'compact', label: 'Compacto' },
                  { id: 'circular', label: 'Circular' },
                  { id: 'split', label: 'Split Trust' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setWidgetStyle(s.id as WidgetStyle)}
                    className={cn(
                      'p-3 rounded-xl border text-center text-xs font-bold transition-all',
                      widgetStyle === s.id
                        ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles de Campos */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Campos Ativos
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Estrelas &amp; Nota Média
                  </span>
                  <Switch checked={showRating} onCheckedChange={setShowRating} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total de Avaliações
                  </span>
                  <Switch checked={showReviewsCount} onCheckedChange={setShowReviewsCount} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Trust Score (%)
                  </span>
                  <Switch checked={showTrustScore} onCheckedChange={setShowTrustScore} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Badge de Verificação
                  </span>
                  <Switch checked={showRank} onCheckedChange={setShowRank} />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Pré-visualização & Código do Widget */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Pré-visualização do Widget
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">● Conectado em tempo real</span>
              </div>

              <div className="flex justify-center items-center py-8 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[200px]">
                <WidgetBadge
                  companyData={previewCompanyData}
                  theme={widgetTheme}
                  style={widgetStyle}
                  showRating={showRating}
                  showReviewsCount={showReviewsCount}
                  showTrustScore={showTrustScore}
                  showRank={showRank}
                  highlightColor={highlightColor}
                />
              </div>
            </div>

            {/* Código de Incorporação do Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Código do Widget
                </h4>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={widgetIntegrationTab === 'html' ? 'default' : 'ghost'}
                    onClick={() => setWidgetIntegrationTab('html')}
                    className="h-7 text-[10px] px-2 font-bold"
                  >
                    Script JS
                  </Button>
                  <Button
                    size="sm"
                    variant={widgetIntegrationTab === 'iframe' ? 'default' : 'ghost'}
                    onClick={() => setWidgetIntegrationTab('iframe')}
                    className="h-7 text-[10px] px-2 font-bold"
                  >
                    Iframe
                  </Button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] leading-relaxed overflow-x-auto border border-slate-800 shadow-inner select-all">
                  {widgetIntegrationTab === 'html' ? widgetJsSnippet : widgetIframeSnippet}
                </pre>
                <Button
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      widgetIntegrationTab === 'html' ? widgetJsSnippet : widgetIframeSnippet,
                      'Widget Embed'
                    )
                  }
                  className="absolute top-2.5 right-2.5 h-7 px-2.5 text-[10px] bg-white text-slate-900 hover:bg-slate-100 font-bold"
                >
                  {copiedSnippet === 'Widget Embed' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSnippet === 'Widget Embed' ? 'Copiado' : 'Copiar'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: BIBLIOTECA DE RELATÓRIOS & ATIVOS DE MARCA (G2 REPORTS LIBRARY)     */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Biblioteca de Relatórios e Certificados Digitais
            </h3>
            <p className="text-xs text-slate-500">
              Baixe materiais em alta definição para anexar em propostas corporativas, licitações e apresentações comerciais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Certificado Digital */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Certificado de Idoneidade Técnica 2026 (PDF)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Documento formal emitido pelo Avalia Solar atestando o Trust Score de {trustScore}%,
                  verificação cadastral e histórico de satisfação.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(publicProfileUrl, '_blank');
                  toast.success('Abrindo página de verificação pública para impressão/PDF...');
                }}
                className="w-full gap-2 text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Gerar Certificado Oficial</span>
              </Button>
            </div>

            {/* Vetores e SVGs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pacote de Selos em Alta Resolução (SVG/PNG)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Arquivos vetoriais em SVG e PNG com fundo transparente para inclusão em propostas
                  comerciais, adesivagem de frotas e uniformes.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(badgeHtmlSnippet, 'Código Vetorial')}
                className="w-full gap-2 text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Copiar Ativo Vetorial</span>
              </Button>
            </div>

            {/* Brand Guidelines */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Palette className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Diretrizes de Co-Branding &amp; Selos
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Manual de boas práticas para aplicação de marcas parceiras, margens de respiro e
                  declarações de conformidade autorizadas.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open('/termos', '_blank');
                }}
                className="w-full gap-2 text-xs font-semibold"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ver Diretrizes de Marca</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Card de Impacto no ROI (Benchmark my.G2) */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent p-6 dark:border-slate-800 dark:from-blue-950/20 dark:via-indigo-950/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Como os Selos do Avalia Solar geram novos negócios?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Empresas parceiras que exibem o selo oficial em seu site observam em média{' '}
                <strong>+28% de conversão</strong> em propostas enviadas e um aumento direto no tráfego
                de compradores qualificados através do backlink de autoridade.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              window.open(trackedProfileUrl, '_blank');
            }}
            className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs shrink-0"
          >
            <span>Testar Link do Perfil</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
