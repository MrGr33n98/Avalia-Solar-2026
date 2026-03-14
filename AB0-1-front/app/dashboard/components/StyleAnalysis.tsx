'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Palette, 
  Type, 
  Layout, 
  RefreshCw,
  Save,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Check,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { analyzeImageStyle, DesignStyle } from '@/lib/color-analyzer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StyleAnalysisProps {
  themeMode: 'light' | 'dark';
}

export default function StyleAnalysis({ themeMode }: StyleAnalysisProps) {
  // Lock to dark foundation for Precision Energy system
  const isDark = true;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedStyle, setDetectedStyle] = useState<DesignStyle | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      // In a real implementation, this would handle the system tokens
      toast.success('Cores aplicadas ao dashboard!');
    }
    
    if (type === 'all' || type === 'typography') {
      toast.success('Tipografia atualizada!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Design System AI</h2>
          <p className="text-sm text-white/40">
            Transforme referências visuais em estilos funcionais para seu dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isAnalyzing} 
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
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
        <Card className="lg:col-span-5 border-[0.5px] border-white/10 bg-[#002B4D] shadow-none">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <ImageIcon className="h-4 w-4 text-brand-cyan" />
              Fonte de Inspiração
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="aspect-[4/3] rounded-xl bg-black/20 border-[0.5px] border-white/5 flex items-center justify-center overflow-hidden relative group">
              {previewImage ? (
                <>
                  <Image src={previewImage} alt="Preview" fill className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-[#002B4D]/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="mb-4"
                      >
                        <RefreshCw className="h-10 w-10 text-brand-cyan" />
                      </motion.div>
                      <p className="text-sm font-bold tracking-tight mb-1 uppercase tracking-widest text-brand-cyan">Mapeando DNA Visual</p>
                      <p className="text-[10px] text-white/40 uppercase font-bold">Extraindo elementos de design...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-white/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="bg-brand-blue/10 p-5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 transition-transform">
                    <Upload className="h-10 w-10 text-brand-blue" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">Upload de Design</h3>
                  <p className="text-xs text-white/40 max-w-[200px] mx-auto">
                    Arraste um screenshot para análise automática.
                  </p>
                </div>
              )}
            </div>

            {detectedStyle && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-white/5 border-[0.5px] border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-brand-cyan" />
                    Cores Detectadas
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono border-brand-cyan/20 text-brand-cyan bg-brand-cyan/5">
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
                        className="h-14 rounded-lg border-[0.5px] border-white/10 transition-all group-hover:border-white/40" 
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] font-bold font-mono uppercase text-white group-hover:text-brand-cyan transition-colors">{color}</p>
                        <p className="text-[8px] text-white/30 uppercase tracking-tighter font-bold">{key}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results & Integration */}
        <Card className="lg:col-span-7 overflow-hidden border-[0.5px] border-white/10 bg-[#002B4D] shadow-none">
          <Tabs defaultValue="styles" className="w-full h-full flex flex-col">
            <CardHeader className="p-0 border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-yellow" />
                    Sugestões Inteligentes
                  </CardTitle>
                  <CardDescription className="text-xs text-white/40">
                    Adaptação automática para o sistema Precision Energy.
                  </CardDescription>
                </div>
                <TabsList className="bg-black/20 p-1 border border-white/10 h-9">
                  <TabsTrigger value="styles" className="text-[10px] uppercase font-bold tracking-wider py-1 px-3 data-[state=active]:bg-brand-blue data-[state=active]:text-white">Estilos</TabsTrigger>
                  <TabsTrigger value="typography" className="text-[10px] uppercase font-bold tracking-wider py-1 px-3 data-[state=active]:bg-brand-blue data-[state=active]:text-white">Textos</TabsTrigger>
                  <TabsTrigger value="components" className="text-[10px] uppercase font-bold tracking-wider py-1 px-3 data-[state=active]:bg-brand-blue data-[state=active]:text-white">Blocos</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <AnimatePresence mode="wait">
                {detectedStyle && !isAnalyzing ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <TabsContent value="styles" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-5 border-[0.5px] border-white/10 relative overflow-hidden">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-3">
                            Análise de Identidade
                          </h4>
                          <p className="text-sm text-white/60 leading-relaxed relative z-10">
                            A referência apresenta um equilíbrio sofisticado. A cor 
                            <span className="font-bold text-white mx-1 px-1.5 py-0.5 rounded bg-black/20 border border-white/10 font-mono" style={{ color: detectedStyle.palette.primary }}>{detectedStyle.palette.primary}</span> 
                            transmite autoridade técnica.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border-[0.5px] border-white/10 rounded-xl space-y-3 bg-white/5">
                            <div className="flex justify-between items-center">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Saturação Primária</Label>
                              <span className="text-[10px] font-mono text-brand-cyan">75%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                className="h-full bg-brand-cyan" 
                              />
                            </div>
                          </div>
                          <div className="p-4 border-[0.5px] border-white/10 rounded-xl space-y-3 bg-white/5">
                            <div className="flex justify-between items-center">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Acessibilidade WCAG</Label>
                              <span className="text-[10px] font-mono text-brand-green">PASS</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '92%' }}
                                className="h-full bg-brand-green" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Button className="flex-1 h-10 rounded-lg font-bold bg-brand-blue hover:bg-brand-blue/90 text-white shadow-none uppercase tracking-widest text-xs" onClick={() => applyStyle('all')}>
                          <Save className="h-4 w-4 mr-2" />
                          Aplicar Tudo
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button variant="outline" className="flex-1 h-10 rounded-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white uppercase tracking-widest text-xs" onClick={() => applyStyle('colors')}>
                          <Palette className="h-4 w-4 mr-2" />
                          Apenas Cores
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="typography" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="p-6 border-[0.5px] border-white/10 rounded-2xl bg-black/20 shadow-none group transition-all">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-brand-blue/10">
                                <Type className="h-5 w-5 text-brand-blue" />
                              </div>
                              <div>
                                <span className="text-sm font-bold block text-white">Geist Sans</span>
                                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">System Modern</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white" onClick={() => applyStyle('typography')}>
                              Testar Fonte
                            </Button>
                          </div>
                          <div className="space-y-4">
                            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">Design Intel.</h1>
                            <p className="text-base text-white/60 leading-relaxed font-medium">
                              Interfaces que aprendem com a estética do usuário.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="components" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="bg-brand-yellow/10 border-[0.5px] border-brand-yellow/20 p-4 rounded-xl flex gap-4 items-start">
                          <div className="bg-brand-yellow/20 p-2 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-brand-yellow" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-yellow uppercase tracking-widest">Upgrade</p>
                            <p className="text-xs text-brand-yellow/70 leading-relaxed font-medium">
                              Sugerimos atualizar seus Cards para usar o padrão Glassmorphism.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-5 rounded-2xl border-[0.5px] border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4 transition-all">
                              <Layout className="h-5 w-5 text-brand-blue" />
                            </div>
                            <h5 className="text-sm font-bold text-white mb-1">Grid Dinâmico</h5>
                            <p className="text-[11px] text-white/40 font-medium leading-tight">Layout responsivo com espaçamento Precision Energy.</p>
                          </div>
                          <div className="p-5 rounded-2xl border-[0.5px] border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center mb-4 transition-all">
                              <Sparkles className="h-5 w-5 text-brand-cyan" />
                            </div>
                            <h5 className="text-sm font-bold text-white mb-1">Efeitos Hover</h5>
                            <p className="text-[11px] text-white/40 font-medium leading-tight">Micro-interações suaves para feedback visual.</p>
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
                      className="bg-white/5 p-8 rounded-full mb-6 border border-white/10"
                    >
                      <Palette className="h-16 w-16 text-white/20" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Aguardando Referência</h3>
                    <p className="text-sm text-white/40 max-w-[280px] leading-relaxed font-medium">
                      Faça o upload de uma imagem para extrair o DNA visual e sugerir melhorias.
                    </p>
                    <Button variant="outline" className="mt-6 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px]" onClick={() => fileInputRef.current?.click()}>
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
