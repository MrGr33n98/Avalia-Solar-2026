'use client';

/**
 * Backlinks and Button Customization Manager
 * 
 * Sistema completo de gerenciamento de backlinks e customização de botões:
 * - Configuração de backlinks estratégicos
 * - Customização avançada de botões (cores, textos, ícones)
 * - Preview em tempo real
 * - Gestão de múltiplos CTAs
 * - Analytics de performance
 * 
 * @module BacklinksButtonManager
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Link as LinkIcon,
  Plus,
  Save,
  Eye,
  Palette,
  Type,
  Sparkles,
  ExternalLink,
  Copy,
  Trash2,
  BarChart3,
  Settings,
  Code,
  MousePointer,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Backlink {
  id: string;
  url: string;
  title: string;
  rel: string;
  target: '_blank' | '_self';
  position: 'header' | 'footer' | 'sidebar' | 'content';
  active: boolean;
  analytics: {
    clicks: number;
    impressions: number;
    ctr: number;
  };
}

interface ButtonConfig {
  id: string;
  text: string;
  variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition: 'left' | 'right';
  colors: {
    bg: string;
    text: string;
    hover: string;
    border?: string;
  };
  animation: 'none' | 'pulse' | 'bounce' | 'glow';
  link: string;
  position: string;
  active: boolean;
  analytics: {
    clicks: number;
    conversions: number;
  };
}

interface BacklinksButtonManagerProps {
  companyId: string;
}

const iconOptions = [
  { value: 'arrow-right', label: 'Seta Direita', icon: '→' },
  { value: 'external', label: 'Link Externo', icon: '↗' },
  { value: 'phone', label: 'Telefone', icon: '📞' },
  { value: 'email', label: 'Email', icon: '✉' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'download', label: 'Download', icon: '⬇' },
  { value: 'cart', label: 'Carrinho', icon: '🛒' },
  { value: 'star', label: 'Estrela', icon: '⭐' },
];

const colorPresets = [
  { name: 'Navy Avalia', bg: '#004996', text: '#ffffff', hover: '#003366' },
  { name: 'Ciano Avalia', bg: '#00AFEF', text: '#1A1A1A', hover: '#0090c4' },
  { name: 'Verde Avalia', bg: '#8DC63F', text: '#1A1A1A', hover: '#7bb134' },
  { name: 'Amarelo Avalia', bg: '#FCEE21', text: '#1A1A1A', hover: '#e5d81e' },
  { name: 'Escuro', bg: '#1f2937', text: '#ffffff', hover: '#111827' },
];

export default function BacklinksButtonManager({ companyId }: BacklinksButtonManagerProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([
    {
      id: '1',
      url: 'https://example.com/parceiro',
      title: 'Site Parceiro',
      rel: 'nofollow',
      target: '_blank',
      position: 'footer',
      active: true,
      analytics: {
        clicks: 234,
        impressions: 5420,
        ctr: 4.3,
      },
    },
  ]);

  const [buttons, setButtons] = useState<ButtonConfig[]>([
    {
      id: '1',
      text: 'Solicitar Orçamento',
      variant: 'default',
      size: 'lg',
      icon: 'arrow-right',
      iconPosition: 'right',
      colors: {
        bg: '#004996',
        text: '#ffffff',
        hover: '#003366',
      },
      animation: 'glow',
      link: '/quote',
      position: 'hero',
      active: true,
      analytics: {
        clicks: 892,
        conversions: 67,
      },
    },
  ]);

  const [selectedButton, setSelectedButton] = useState<ButtonConfig | null>(null);
  const [previewButton, setPreviewButton] = useState<ButtonConfig>(buttons[0] || {
    id: 'preview',
    text: 'Preview Button',
    variant: 'default',
    size: 'md',
    iconPosition: 'right',
    colors: {
      bg: '#3b82f6',
      text: '#ffffff',
      hover: '#2563eb',
    },
    animation: 'none',
    link: '#',
    position: 'hero',
    active: true,
    analytics: { clicks: 0, conversions: 0 },
  });

  const [isBacklinkDialogOpen, setIsBacklinkDialogOpen] = useState(false);
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false);

  const handleAddBacklink = () => {
    const newBacklink: Backlink = {
      id: Date.now().toString(),
      url: '',
      title: '',
      rel: 'nofollow',
      target: '_blank',
      position: 'footer',
      active: true,
      analytics: {
        clicks: 0,
        impressions: 0,
        ctr: 0,
      },
    };
    setBacklinks([...backlinks, newBacklink]);
    setIsBacklinkDialogOpen(true);
  };

  const handleAddButton = () => {
    const newButton: ButtonConfig = {
      id: Date.now().toString(),
      text: 'Novo Botão',
      variant: 'default',
      size: 'md',
      iconPosition: 'right',
      colors: {
        bg: '#3b82f6',
        text: '#ffffff',
        hover: '#2563eb',
      },
      animation: 'none',
      link: '#',
      position: 'content',
      active: true,
      analytics: {
        clicks: 0,
        conversions: 0,
      },
    };
    setButtons([...buttons, newButton]);
    setSelectedButton(newButton);
    setPreviewButton(newButton);
    setIsButtonDialogOpen(true);
  };

  const handleDeleteBacklink = (id: string) => {
    if (confirm('Tem certeza que deseja deletar este backlink?')) {
      setBacklinks(backlinks.filter((b) => b.id !== id));
    }
  };

  const handleDeleteButton = (id: string) => {
    if (confirm('Tem certeza que deseja deletar este botão?')) {
      setButtons(buttons.filter((b) => b.id !== id));
    }
  };

  const handleCopyButtonCode = (button: ButtonConfig) => {
    const code = `<button
  class="btn btn-${button.variant} btn-${button.size}"
  style="background-color: ${button.colors.bg}; color: ${button.colors.text};"
>
  ${button.text}
</button>`;
    navigator.clipboard.writeText(code);
    alert('Código copiado para a área de transferência!');
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setPreviewButton({
      ...previewButton,
      colors: {
        bg: preset.bg,
        text: preset.text,
        hover: preset.hover,
      },
    });
  };

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'glow':
        return 'shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <LinkIcon className="h-8 w-8 text-primary" />
            Backlinks & Customização de Botões
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie backlinks estratégicos e personalize CTAs para máxima conversão
          </p>
        </div>
      </div>

      <Tabs defaultValue="buttons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="buttons">
            <MousePointer className="h-4 w-4 mr-2" />
            Botões CTA
          </TabsTrigger>
          <TabsTrigger value="backlinks">
            <LinkIcon className="h-4 w-4 mr-2" />
            Backlinks
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab: Botões CTA */}
        <TabsContent value="buttons" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor de Botão */}
            <Card>
              <CardHeader>
                <CardTitle>Customizar Botão</CardTitle>
                <CardDescription>Configure aparência e comportamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input
                    value={previewButton.text}
                    onChange={(e) =>
                      setPreviewButton({ ...previewButton, text: e.target.value })
                    }
                    placeholder="Ex: Solicitar Orçamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link de Destino</Label>
                  <Input
                    value={previewButton.link}
                    onChange={(e) =>
                      setPreviewButton({ ...previewButton, link: e.target.value })
                    }
                    placeholder="Ex: /orcamento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamanho</Label>
                    <Select
                      value={previewButton.size}
                      onValueChange={(value: any) =>
                        setPreviewButton({ ...previewButton, size: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Pequeno</SelectItem>
                        <SelectItem value="md">Médio</SelectItem>
                        <SelectItem value="lg">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Select
                      value={previewButton.icon}
                      onValueChange={(value) =>
                        setPreviewButton({ ...previewButton, icon: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {iconOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.icon} {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Posição do Ícone</Label>
                  <Select
                    value={previewButton.iconPosition}
                    onValueChange={(value: any) =>
                      setPreviewButton({ ...previewButton, iconPosition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Animação</Label>
                  <Select
                    value={previewButton.animation}
                    onValueChange={(value: any) =>
                      setPreviewButton({ ...previewButton, animation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="pulse">Pulsar</SelectItem>
                      <SelectItem value="bounce">Balançar</SelectItem>
                      <SelectItem value="glow">Brilho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Cores Predefinidas</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyColorPreset(preset)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:border-primary transition-colors"
                      >
                        <div
                          className="w-full h-8 rounded"
                          style={{ backgroundColor: preset.bg }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Cores Personalizadas</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Fundo</Label>
                      <Input
                        type="color"
                        value={previewButton.colors.bg}
                        onChange={(e) =>
                          setPreviewButton({
                            ...previewButton,
                            colors: { ...previewButton.colors, bg: e.target.value },
                          })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Texto</Label>
                      <Input
                        type="color"
                        value={previewButton.colors.text}
                        onChange={(e) =>
                          setPreviewButton({
                            ...previewButton,
                            colors: { ...previewButton.colors, text: e.target.value },
                          })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Hover</Label>
                      <Input
                        type="color"
                        value={previewButton.colors.hover}
                        onChange={(e) =>
                          setPreviewButton({
                            ...previewButton,
                            colors: { ...previewButton.colors, hover: e.target.value },
                          })
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleAddButton}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Botão
                  </Button>
                  <Button variant="outline" onClick={() => handleCopyButtonCode(previewButton)}>
                    <Code className="h-4 w-4 mr-2" />
                    Copiar Código
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview em Tempo Real</CardTitle>
                <CardDescription>Veja como o botão aparecerá no site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg min-h-[300px]">
                  <motion.button
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${getAnimationClass(
                      previewButton.animation
                    )}`}
                    style={{
                      backgroundColor: previewButton.colors.bg,
                      color: previewButton.colors.text,
                    }}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: previewButton.colors.hover,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {previewButton.icon && previewButton.iconPosition === 'left' && (
                      <span className="text-xl">
                        {iconOptions.find((i) => i.value === previewButton.icon)?.icon}
                      </span>
                    )}
                    <span
                      className={
                        previewButton.size === 'sm'
                          ? 'text-sm'
                          : previewButton.size === 'lg'
                          ? 'text-lg'
                          : 'text-base'
                      }
                    >
                      {previewButton.text}
                    </span>
                    {previewButton.icon && previewButton.iconPosition === 'right' && (
                      <span className="text-xl">
                        {iconOptions.find((i) => i.value === previewButton.icon)?.icon}
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Informações Técnicas */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tamanho:</span>
                    <span className="font-medium">{previewButton.size.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Animação:</span>
                    <span className="font-medium capitalize">{previewButton.animation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cor de Fundo:</span>
                    <span className="font-mono text-xs">{previewButton.colors.bg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cor do Texto:</span>
                    <span className="font-mono text-xs">{previewButton.colors.text}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Botões Salvos */}
          <Card>
            <CardHeader>
              <CardTitle>Botões Configurados</CardTitle>
              <CardDescription>Gerencie todos os CTAs do seu site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {buttons.map((button) => (
                  <div
                    key={button.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: button.colors.bg }}
                      >
                        {button.text.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{button.text}</h4>
                        <p className="text-sm text-muted-foreground">{button.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {button.analytics.clicks.toLocaleString()} cliques
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {button.analytics.conversions} conversões
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewButton(button);
                          setSelectedButton(button);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyButtonCode(button)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteButton(button.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backlinks */}
        <TabsContent value="backlinks" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold">Gestão de Backlinks</h3>
              <p className="text-sm text-muted-foreground">
                Configure links estratégicos para SEO e parcerias
              </p>
            </div>
            <Button onClick={handleAddBacklink}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Backlink
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {backlinks.map((backlink) => (
              <Card key={backlink.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{backlink.title}</h4>
                        <Badge variant={backlink.active ? 'default' : 'secondary'}>
                          {backlink.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">{backlink.position}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        {backlink.url}
                      </p>
                      <div className="flex gap-4 text-sm pt-2">
                        <div>
                          <span className="text-muted-foreground">Cliques:</span>
                          <span className="font-semibold ml-1">
                            {backlink.analytics.clicks.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impressões:</span>
                          <span className="font-semibold ml-1">
                            {backlink.analytics.impressions.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CTR:</span>
                          <span className="font-semibold ml-1">
                            {backlink.analytics.ctr.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteBacklink(backlink.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance de CTAs e Backlinks</CardTitle>
              <CardDescription>Métricas detalhadas de conversão</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gráficos e análises de performance serão implementados aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
