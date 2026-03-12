'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, ShieldCheck, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import WidgetBadge from './WidgetBadge';
import { cn } from '@/lib/utils';

interface TrustWidgetDashboardProps {
  company: any;
}

export default function TrustWidgetDashboard({ company }: TrustWidgetDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showRank, setShowRank] = useState(true);
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiKey = company?.api_key || 'SUA_API_KEY';
  const companyId = company?.id || 'ID';

  const snippet = `<div 
    data-avalia-solar-widget 
    data-company-id="${companyId}" 
    data-api-key="${apiKey}"
    data-theme="${theme}"
    data-size="${size}"
    data-show-rank="${showRank}"
  ></div>
  <script src="${apiBaseUrl}/trust-widget-embed.js" async></script>`;

  const handleCopy = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('Snippet copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mockCompanyData = {
    name: company?.name || 'Sua Empresa',
    verified: company?.verified ?? true,
    trust_score: company?.trust_score || 95,
    rating_avg: company?.rating_avg || 4.8,
    reviews_count: company?.reviews_count || 124,
    verified_badge_image_url: company?.verified_badge_image_url,
    public_profile_url: '#',
    priority_score: company?.priority_score || 100,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">Marketing Externo (Widget)</h2>
          <p className="text-sm text-white/40">
            Exiba sua reputação e sua posição no Ranking do AvaliaSolar diretamente no seu site.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#002B4D] border-white/10 shadow-none">
            <CardHeader className="p-4 border-b border-white/5">
              <CardTitle className="text-white text-lg font-bold">Configuração do Widget Dinâmico</CardTitle>
              <CardDescription className="text-white/40">
                Personalize a aparência do selo para combinar com o design do seu site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Cor de Fundo (Tema)</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex-1 h-9 text-xs font-bold transition-all border-white/10",
                      theme === 'light' ? "bg-white text-[#002B4D]" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    Claro
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex-1 h-9 text-xs font-bold transition-all border-white/10",
                      theme === 'dark' ? "bg-brand-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    Escuro
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tamanho</Label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <Button 
                      key={s}
                      variant={size === s ? 'default' : 'outline'} 
                      onClick={() => setSize(s)} 
                      className={cn(
                        "flex-1 h-9 text-[10px] font-bold uppercase tracking-wider transition-all border-white/10",
                        size === s ? "bg-brand-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {s === 'small' ? 'Pequeno' : s === 'medium' ? 'Médio' : 'Grande'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Exibir Posição no Ranking?</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={showRank ? 'default' : 'outline'} 
                    onClick={() => setShowRank(true)} 
                    className={cn(
                      "flex-1 h-9 text-xs font-bold transition-all border-white/10",
                      showRank ? "bg-brand-yellow text-[#002B4D]" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <Trophy className="w-3.5 h-3.5 mr-2"/> Sim, exibir troféu
                  </Button>
                  <Button 
                    variant={!showRank ? 'default' : 'outline'} 
                    onClick={() => setShowRank(false)} 
                    className={cn(
                      "flex-1 h-9 text-xs font-bold transition-all border-white/10",
                      !showRank ? "bg-brand-blue text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    Apenas notas (Padrão)
                  </Button>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Código para Incorporação (HTML)</Label>
                <div className="relative group">
                  <pre className="p-4 bg-black/40 text-brand-cyan rounded-xl text-[11px] overflow-x-auto border-[0.5px] border-white/10 leading-relaxed font-mono">
                    {snippet}
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 text-white/30 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-white/30 mt-2 font-medium">
                  Copie e cole este código antes do fechamento da tag <code className="text-white/50">&lt;/body&gt;</code> do seu site.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#002B4D] border-white/10 shadow-none">
            <CardHeader className="p-4 border-b border-white/5">
              <CardTitle className="text-white text-base font-bold">Instruções de Instalação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <ol className="list-decimal list-inside space-y-2 text-white/50 text-xs font-medium">
                <li>Escolha o tema que melhor combina com seu site.</li>
                <li>Copie o código acima clicando no ícone de cópia.</li>
                <li>No seu site, localize onde deseja exibir o selo.</li>
                <li>Cole o código HTML e salve a página.</li>
              </ol>
              <div className="bg-brand-blue/10 border-[0.5px] border-brand-blue/20 p-4 rounded-xl flex gap-3">
                <ShieldCheck className="h-5 w-5 text-brand-cyan mt-0.5" />
                <p className="text-[11px] font-medium text-brand-cyan/80 leading-relaxed">
                  O widget é carregado de forma assíncrona para garantir que não afete a velocidade de carregamento do seu site.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#002B4D] border-brand-blue/20 shadow-none sticky top-6 overflow-hidden">
            <CardHeader className="bg-brand-blue/10 p-4 border-b border-brand-blue/20">
              <CardTitle className="text-xs font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-black/20 min-h-[300px] flex items-center justify-center border-t border-white/5">
               <WidgetBadge companyData={mockCompanyData} theme={theme} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
