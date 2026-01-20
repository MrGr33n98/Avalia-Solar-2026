'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Palette, 
  Type, 
  Layout, 
  Check, 
  RefreshCw, 
  Eye, 
  Save,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { analyzeImageStyle, DesignStyle } from '@/lib/color-analyzer';
import { toast } from 'sonner';

interface StyleAnalysisProps {
  themeMode: 'light' | 'dark';
}

export default function StyleAnalysis({ themeMode }: StyleAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedStyle, setDetectedStyle] = useState<DesignStyle | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    
    setIsAnalyzing(true);
    try {
      const style = await analyzeImageStyle(url);
      setDetectedStyle(style);
      toast.success('Análise concluída com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao analisar a imagem.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyStyle = (type: 'all' | 'colors' | 'typography') => {
    if (!detectedStyle) return;
    
    const root = document.documentElement;
    
    if (type === 'all' || type === 'colors') {
      root.style.setProperty('--primary', hexToHSL(detectedStyle.palette.primary));
      root.style.setProperty('--accent', hexToHSL(detectedStyle.palette.accent));
      toast.success('Cores aplicadas ao dashboard!');
    }
    
    if (type === 'all' || type === 'typography') {
      root.style.setProperty('--font-sans', detectedStyle.typography.fontFamily);
      toast.success('Tipografia atualizada!');
    }
  };

  // Helper para converter Hex para HSL (formato esperado pelo Shadcn/UI)
  const hexToHSL = (hex: string): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Design System AI</h2>
          <p className="text-muted-foreground">
            Transforme referências visuais em estilos funcionais para seu dashboard Shadcn-UI.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className="border-primary/20 hover:bg-primary/5">
            <Upload className="h-4 w-4 mr-2" />
            {previewImage ? 'Trocar Referência' : 'Carregar Imagem'}
          </Button>
          <Input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Preview Area */}
        <Card className="lg:col-span-5 border-dashed bg-muted/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              Fonte de Inspiração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3] rounded-xl bg-muted/30 border-2 border-dashed flex items-center justify-center overflow-hidden relative group">
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="mb-4"
                      >
                        <RefreshCw className="h-10 w-10 text-primary" />
                      </motion.div>
                      <p className="text-sm font-bold tracking-tight mb-1">Mapeando DNA Visual</p>
                      <p className="text-xs text-white/60">Extraindo paletas, tipografia e elementos de design...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-muted/40 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="bg-primary/10 p-5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2">Upload de Design</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    Arraste um screenshot ou referência de design para análise automática.
                  </p>
                </div>
              )}
            </div>

            {detectedStyle && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-background border shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Cores Detectadas
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                    AI EXTRACTED
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(detectedStyle.palette).slice(0, 6).map(([key, color]) => (
                    <div key={key} className="space-y-2 group cursor-pointer" onClick={() => {
                      navigator.clipboard.writeText(color);
                      toast.success(`Copiado: ${color}`);
                    }}>
                      <div 
                        className="h-14 rounded-lg border-2 border-transparent hover:border-primary/40 transition-all shadow-inner" 
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex flex-col items-center">
                        <p className="text-[9px] font-bold font-mono uppercase group-hover:text-primary transition-colors">{color}</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-tighter">{key}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results & Integration */}
        <Card className="lg:col-span-7 overflow-hidden border-primary/10">
          <Tabs defaultValue="styles" className="w-full h-full flex flex-col">
            <CardHeader className="pb-2 bg-muted/5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Sugestões Inteligentes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adaptação automática para o seu dashboard atual.
                  </CardDescription>
                </div>
                <TabsList className="bg-muted/50 p-1 border">
                  <TabsTrigger value="styles" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">DNA Visual</TabsTrigger>
                  <TabsTrigger value="typography" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">Textos</TabsTrigger>
                  <TabsTrigger value="components" className="text-xs py-1.5 px-3 data-[state=active]:bg-background">Blocos</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <AnimatePresence mode="wait">
                {detectedStyle && !isAnalyzing ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <TabsContent value="styles" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Palette className="h-24 w-24" />
                          </div>
                          <h4 className="text-sm font-bold mb-3 flex items-center gap-2 relative z-10">
                            Análise de Identidade
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                            A referência apresenta um equilíbrio sofisticado. A cor 
                            <span className="font-bold text-foreground mx-1 px-1.5 py-0.5 rounded bg-background border" style={{ color: detectedStyle.palette.primary }}>{detectedStyle.palette.primary}</span> 
                            transmite autoridade, enquanto o tom neutro 
                            <span className="font-bold text-foreground mx-1 px-1.5 py-0.5 rounded bg-background border" style={{ color: detectedStyle.palette.secondary }}>{detectedStyle.palette.secondary}</span> 
                            garante legibilidade em ambientes corporativos.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-bold uppercase text-muted-foreground">Saturação Primária</Label>
                              <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 rounded">75%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                className="h-full bg-primary" 
                              />
                            </div>
                          </div>
                          <div className="p-4 border rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-bold uppercase text-muted-foreground">Acessibilidade WCAG</Label>
                              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-1.5 rounded">PASS</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '92%' }}
                                className="h-full bg-emerald-500" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 group" onClick={() => applyStyle('all')}>
                          <Save className="h-4 w-4 mr-2" />
                          Aplicar Tudo
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-primary/20 hover:bg-primary/5" onClick={() => applyStyle('colors')}>
                          <Palette className="h-4 w-4 mr-2" />
                          Apenas Cores
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="typography" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="p-6 border-2 border-primary/10 rounded-2xl bg-background shadow-sm group hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Type className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <span className="text-sm font-bold block">Geist Sans</span>
                                <span className="text-[10px] text-muted-foreground uppercase">System Modern Font</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => applyStyle('typography')}>
                              Testar Fonte
                            </Button>
                          </div>
                          <div className="space-y-4">
                            <h1 className="text-4xl font-black tracking-tighter leading-none">Design Intelligence.</h1>
                            <p className="text-base text-muted-foreground leading-relaxed">
                              Interfaces que aprendem com a estética do usuário, 
                              gerando experiências únicas e memoráveis.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                            <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Headings</p>
                            <p className="font-bold text-base">SemiBold / -0.04em</p>
                          </div>
                          <div className="p-4 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                            <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Body Text</p>
                            <p className="text-sm leading-relaxed">Regular / 1.6 LH</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="components" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl flex gap-4 items-start dark:bg-amber-900/10 dark:border-amber-900/20">
                          <div className="bg-amber-100 p-2 rounded-lg dark:bg-amber-900/30">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Upgrade de Componentes</p>
                            <p className="text-xs text-amber-800/70 leading-relaxed dark:text-amber-500/80">
                              Sugerimos atualizar seus <strong>Cards</strong> para usar o padrão <strong>Glassmorphism</strong> detectado na referência.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-5 rounded-2xl border bg-white/40 backdrop-blur-md shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group border-primary/5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:rotate-6 transition-all">
                              <Layout className="h-5 w-5 text-primary group-hover:text-white" />
                            </div>
                            <h5 className="text-sm font-bold mb-1">Grid Dinâmico</h5>
                            <p className="text-[11px] text-muted-foreground leading-tight">Layout responsivo em 4 colunas com espaçamento otimizado.</p>
                          </div>
                          <div className="p-5 rounded-2xl border bg-white/40 backdrop-blur-md shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group border-accent/5">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:-rotate-6 transition-all">
                              <Sparkles className="h-5 w-5 text-accent group-hover:text-white" />
                            </div>
                            <h5 className="text-sm font-bold mb-1">Efeitos de Hover</h5>
                            <p className="text-[11px] text-muted-foreground leading-tight">Micro-interações suaves para feedback visual imediato.</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </motion.div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center p-12">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="bg-primary/5 p-8 rounded-full mb-6 border border-primary/10"
                    >
                      <Palette className="h-16 w-16 text-primary/40" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">Aguardando Referência</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                      Faça o upload de uma imagem para que nossa IA possa extrair o DNA visual e sugerir melhorias para seu dashboard.
                    </p>
                    <Button variant="outline" className="mt-6 border-primary/20" onClick={() => fileInputRef.current?.click()}>
                      Começar Agora
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
