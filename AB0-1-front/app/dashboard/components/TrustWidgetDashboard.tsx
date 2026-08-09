'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Zap, 
  Globe, 
  Code2, 
  Smartphone, 
  Monitor, 
  Layout, 
  Laptop,
  Info,
  Layers,
  HelpCircle,
  Sparkles,
  CheckCircle,
  FileText,
  MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import WidgetBadge from './WidgetBadge';
import { cn } from '@/lib/utils';

interface CompanyWidgetData {
  id: string | number;
  name: string;
  verified: boolean;
  trust_score?: number;
  rating_avg?: number;
  reviews_count?: number;
  logo_url?: string;
  verified_badge_image_url?: string;
  public_profile_url?: string;
  api_key?: string;
}

interface TrustWidgetDashboardProps {
  company: CompanyWidgetData | null;
}

type WidgetStyle = 'default' | 'compact' | 'circular' | 'split';

export default function TrustWidgetDashboard({ company }: TrustWidgetDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [style, setStyle] = useState<WidgetStyle>('default');
  
  // Customization Toggles
  const [showRating, setShowRating] = useState(true);
  const [showReviewsCount, setShowReviewsCount] = useState(true);
  const [showTrustScore, setShowTrustScore] = useState(true);
  const [showRank, setShowRank] = useState(true);
  const [highlightColor, setHighlightColor] = useState('#2563EB');
  const [integrationTab, setIntegrationTab] = useState<'js' | 'iframe'>('js');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.avaliasolar.com.br';
  const apiKey = company?.api_key || 'SUA_API_KEY';
  const companyId = company?.id ? String(company.id) : '1772';

  const jsSnippet = `<div id="avaliasolar-trust-widget"
  data-company-id="${companyId}"
  data-api-key="${apiKey}"
  data-theme="${theme}"
  data-style="${style}"
  data-lang="pt-BR"
></div>
<script src="${apiBaseUrl}/api/v1/trust-widget-embed.js" async></script>`;

  const iframeSnippet = `<iframe 
  src="${apiBaseUrl}/api/v1/trust-widget?company_id=${companyId}&theme=${theme}&style=${style}"
  width="100%" 
  height="220" 
  style="border: none; overflow: hidden;"
></iframe>`;

  const snippet = integrationTab === 'js' ? jsSnippet : iframeSnippet;

  const handleCopy = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('Script copiado com sucesso!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const previewData = {
    name: company?.name || 'Sua Empresa',
    verified: company?.verified ?? true,
    trust_score: company?.trust_score ?? 88,
    rating_avg: company?.rating_avg ?? 4.8,
    reviews_count: company?.reviews_count ?? 32,
    logo_url: company?.logo_url,
    verified_badge_image_url: company?.verified_badge_image_url,
    public_profile_url: company?.public_profile_url || '#',
  };

  return (
    <div className="space-y-8 bg-slate-50/50 p-2 rounded-2xl">
      {/* Header section (Breadcrumb & API Status) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>WIDGET</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-bold">Widget de Confiança</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API PROTOCOL</span>
          <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] px-1.5 h-4">ACTIVE v2.4</Badge>
        </div>
      </div>

      {/* Title & Preview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Title, description, benefits */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Widget de <span className="text-blue-600">Confiança</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-xl font-medium leading-relaxed">
              Mostre sua reputação certificada em tempo real e aumente a confiança de novos clientes no seu site corporativo.
            </p>
          </div>

          {/* Quick benefits badge row */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { text: 'Prova social em tempo real', icon: ShieldCheck },
              { text: 'Fácil integração via script', icon: Code2 },
              { text: 'Leve e rápido zero impacto', icon: Zap },
              { text: 'Seguro e confiável dados verificados', icon: Globe }
            ].map((benefit, idx) => {
              const BenefitIcon = benefit.icon;
              return (
                <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm">
                  <BenefitIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{benefit.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Container (Sticky right panel) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pré-visualização</span>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button 
                onClick={() => setPreviewDevice('desktop')}
                className={cn("p-1 rounded", previewDevice === 'desktop' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setPreviewDevice('tablet')}
                className={cn("p-1 rounded", previewDevice === 'tablet' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setPreviewDevice('mobile')}
                className={cn("p-1 rounded", previewDevice === 'mobile' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-[220px]">
            <div className={cn(
              "transition-all duration-300 flex justify-center",
              previewDevice === 'desktop' ? 'w-full' : previewDevice === 'tablet' ? 'w-80' : 'w-64'
            )}>
              <WidgetBadge 
                companyData={previewData}
                theme={theme}
                style={style}
                showRating={showRating}
                showReviewsCount={showReviewsCount}
                showTrustScore={showTrustScore}
                showRank={showRank}
                highlightColor={highlightColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive configuration area (Splits into Customize and Code Copy) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Personalize Widget */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">1</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Personalize seu Widget</h3>
          </div>
          <p className="text-xs text-slate-400">Escolha como seu widget será exibido.</p>

          {/* Theme Selector */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className={cn("h-10 text-xs uppercase tracking-wider font-bold", theme === 'light' ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className={cn("h-10 text-xs uppercase tracking-wider font-bold", theme === 'dark' ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
              >
                Dark
              </Button>
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estilo</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'default', label: 'Padrão', icon: Layout },
                { id: 'compact', label: 'Compacto', icon: Minimize },
                { id: 'circular', label: 'Circular', icon: Sparkles },
                { id: 'split', label: 'Split', icon: Layers }
              ].map((styleOption) => {
                const OptionIcon = styleOption.icon;
                const active = style === styleOption.id;
                return (
                  <button
                    key={styleOption.id}
                    onClick={() => setStyle(styleOption.id as WidgetStyle)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all hover:bg-slate-50/50",
                      active ? "border-blue-600 bg-blue-50/20 text-blue-600" : "border-slate-200 text-slate-500"
                    )}
                  >
                    <OptionIcon className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{styleOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Displayed Fields */}
          <div className="space-y-4 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Informações Exibidas</Label>
            
            <div className="space-y-3">
              {[
                { state: showRating, setter: setShowRating, title: 'Avaliação média', desc: 'Exibe estrelas e nota média' },
                { state: showReviewsCount, setter: setShowReviewsCount, title: 'Número de avaliações', desc: 'Mostra o total de avaliações' },
                { state: showTrustScore, setter: setShowTrustScore, title: 'Score de confiança', desc: 'Exibe o score percentual' },
                { state: showRank, setter: setShowRank, title: 'Selo Diamond', desc: 'Mostra o selo de verificação' }
              ].map((toggle, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">{toggle.title}</p>
                    <p className="text-[10px] text-slate-400">{toggle.desc}</p>
                  </div>
                  <Switch checked={toggle.state} onCheckedChange={toggle.setter} />
                </div>
              ))}
            </div>
          </div>

          {/* Highlight Color */}
          <div className="space-y-3 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor de Destaque</Label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer overflow-hidden bg-transparent"
              />
              <input 
                type="text" 
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Code Snippet & Hints */}
        <div className="lg:col-span-5 space-y-6">
          {/* Copy and embed snippet */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">2</span>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Copie e cole o código</h3>
              </div>
              <a 
                href="/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] font-black text-blue-600 uppercase tracking-wider hover:underline"
              >
                Ver Documentação
              </a>
            </div>

            {/* Integration method tabs */}
            <Tabs 
              value={integrationTab} 
              onValueChange={(val) => setIntegrationTab(val as 'js' | 'iframe')} 
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 bg-slate-50 p-1 rounded-xl">
                <TabsTrigger value="js" className="text-[10px] font-bold uppercase tracking-wider rounded-lg">JavaScript (Recomendado)</TabsTrigger>
                <TabsTrigger value="iframe" className="text-[10px] font-bold uppercase tracking-wider rounded-lg">IFrame</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Code Box */}
            <div className="relative group/snippet overflow-hidden">
              <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] overflow-x-auto leading-relaxed font-mono shadow-inner min-h-[140px] border border-slate-800">
                {snippet}
              </pre>
              <Button
                size="sm"
                className="absolute top-3 right-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold text-[9px] uppercase tracking-wider px-3 h-8 shadow-sm"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </Button>
            </div>

            {/* Warning block */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/40 border border-blue-100">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-900/80 font-medium leading-relaxed">
                O script é assíncrono e não impacta o desempenho do seu site corporativo.
              </p>
            </div>
          </div>

          {/* Section 3: Tips of use */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">3</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Dicas de Uso</h3>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Posicione com destaque', desc: 'Ideal para rodapés, páginas de produto e páginas de checkout.', icon: MousePointerClick },
                { title: 'Aumente a conversão', desc: 'Empresas com o selo Diamond convertem até 32% mais.', icon: Sparkles },
                { title: 'Mantenha sempre ativo', desc: 'O widget atualiza automaticamente em tempo real.', icon: CheckCircle }
              ].map((tip, idx) => {
                const TipIcon = tip.icon;
                return (
                  <div key={idx} className="flex gap-3 items-start p-3 rounded-xl border border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-50/50 text-blue-600 shrink-0">
                      <TipIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-700">{tip.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">{tip.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer navigation/support links */}
      <div className="flex justify-center items-center gap-6 pt-4 text-xs font-bold border-t border-slate-200/60 mt-8">
        <a 
          href="/support" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Falar com suporte</span>
        </a>
        <span className="text-slate-300">|</span>
        <a 
          href="/docs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Ver documentação</span>
        </a>
      </div>
    </div>
  );
}

// Inline Minimize icon since lucide-react might import it as something else
function Minimize(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="m14 10 7-7" />
      <path d="m10 14-7 7" />
    </svg>
  );
}
