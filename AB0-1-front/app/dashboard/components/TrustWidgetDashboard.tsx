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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Marketing Externo (Widget)</h2>
          <p className="text-sm text-muted-foreground">
            Exiba sua reputação e sua posição no Ranking do AvaliaSolar diretamente no seu site.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Widget Dinâmico</CardTitle>
              <CardDescription>
                Personalize a aparência do selo para combinar com o design do seu site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cor de Fundo (Tema)</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    Claro
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    Escuro
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tamanho</Label>
                <div className="flex gap-2">
                  <Button variant={size === 'small' ? 'default' : 'outline'} onClick={() => setSize('small')} className="flex-1 text-xs">Pequeno</Button>
                  <Button variant={size === 'medium' ? 'default' : 'outline'} onClick={() => setSize('medium')} className="flex-1 text-sm">Médio</Button>
                  <Button variant={size === 'large' ? 'default' : 'outline'} onClick={() => setSize('large')} className="flex-1 text-base">Grande</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exibir Posição no Ranking?</Label>
                <div className="flex gap-2">
                  <Button variant={showRank ? 'default' : 'outline'} onClick={() => setShowRank(true)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"><Trophy className="w-4 h-4 mr-2"/> Sim, exibir troféu</Button>
                  <Button variant={!showRank ? 'default' : 'outline'} onClick={() => setShowRank(false)} className="flex-1">Apenas notas (Padrão)</Button>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Label>Código para Incorporação (HTML)</Label>
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-[11px] overflow-x-auto border border-slate-800 leading-relaxed font-mono">
                    {snippet}
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Copie e cole este código antes do fechamento da tag <code>&lt;/body&gt;</code> do seu site, ou dentro de uma div específica no seu rodapé.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instruções de Instalação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Escolha o tema que melhor combina com seu site.</li>
                <li>Copie o código acima clicando no ícone de cópia.</li>
                <li>No seu site, localize onde deseja exibir o selo.</li>
                <li>Cole o código HTML e salve a página.</li>
              </ol>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  O widget é carregado de forma assíncrona para garantir que não afete a velocidade de carregamento do seu site.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-100 shadow-lg shadow-blue-900/5 sticky top-6">
            <CardHeader className="bg-blue-50/50 rounded-t-xl pb-4 border-b border-blue-100">
              <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-slate-50 dark:bg-slate-950 min-h-[300px] flex items-center justify-center rounded-b-xl border-t">
               <WidgetBadge companyData={mockCompanyData} theme={theme} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
