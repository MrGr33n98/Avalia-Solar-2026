'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import WidgetBadge from './WidgetBadge';

interface TrustWidgetDashboardProps {
  company: any;
}

export default function TrustWidgetDashboard({ company }: TrustWidgetDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiKey = company?.api_key || 'SUA_API_KEY';
  const companyId = company?.id || 'ID';

  const snippet = `<div 
    data-avalia-solar-widget 
    data-company-id="${companyId}" 
    data-api-key="${apiKey}"
    data-theme="${theme}"
  ></div>
  <script src="${apiBaseUrl}/trust-widget-embed.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Snippet copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const mockCompanyData = {
    name: company?.name || 'Sua Empresa',
    verified: company?.verified || true,
    trust_score: company?.trust_score || 95,
    rating_avg: company?.rating_avg || 4.8,
    reviews_count: company?.reviews_count || 124,
    verified_badge_image_url: company?.verified_badge_image_url,
    public_profile_url: '#'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Trust Widget</h2>
          <p className="text-sm text-muted-foreground">
            Exiba sua reputação e selo de verificação diretamente no seu site.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Widget</CardTitle>
              <CardDescription>
                Personalize a aparência do widget para o seu site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema do Widget</Label>
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

              <div className="pt-4 space-y-2">
                <Label>Snippet para Incorporação</Label>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-[11px] overflow-x-auto border border-border leading-relaxed">
                    {snippet}
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Copie e cole este código no local do seu site onde deseja que o widget apareça.
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

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Como aparecer� no seu site.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8 bg-slate-50 dark:bg-slate-950 rounded-b-xl border-t">
              <WidgetBadge companyData={mockCompanyData} theme={theme} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
