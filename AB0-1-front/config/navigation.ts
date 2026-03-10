import {
  BarChart3,
  Star,
  Database,
  Edit3,
  Home,
  Trophy,
  ShieldCheck,
  BadgeCheck,
  Link2,
  FileText,
  ImageIcon,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export type NavigationContext = 'operational' | 'quick_access' | 'admin' | 'all';

export interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  context: NavigationContext[];
  group?: string;
  children?: NavigationItem[];
  badge?: boolean;
  description?: string;
}

export interface FlatNavigationItem extends Omit<NavigationItem, 'children'> {
  parentId?: string;
  parentLabel?: string;
}

export const DASHBOARD_NAVIGATION: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Home',
    icon: Home,
    context: ['operational', 'quick_access'],
    group: 'main',
    description: 'Visão geral do dashboard',
  },
  {
    id: 'analytics-group',
    label: 'Analytics',
    icon: BarChart3,
    context: ['operational'],
    group: 'metrics',
    children: [
      { 
        id: 'analytics', 
        label: 'Analytics', 
        icon: TrendingUp, 
        context: ['operational'],
        description: 'Métricas e estatísticas' 
      },
    ],
  },
  {
    id: 'reviews-group',
    label: 'Avaliações',
    icon: Star,
    context: ['operational', 'quick_access'],
    group: 'engagement',
    children: [
      { 
        id: 'reviews', 
        label: 'Avaliações', 
        icon: Star, 
        context: ['operational', 'quick_access'],
        badge: true,
        description: 'Gerenciar avaliações de clientes' 
      },
    ],
  },
  {
    id: 'interaction-group',
    label: 'Dados de interação',
    icon: Database,
    context: ['operational'],
    group: 'engagement',
    children: [
      { 
        id: 'leads', 
        label: 'Oportunidades', 
        icon: Target, 
        context: ['operational', 'quick_access'],
        badge: true,
        description: 'Gerenciar leads e oportunidades' 
      },
    ],
  },
  {
    id: 'product-edit-group',
    label: 'Edição de produto',
    icon: Edit3,
    context: ['operational', 'admin'],
    group: 'management',
    children: [
      { id: 'product-general', label: 'Informações gerais', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-categories', label: 'Categorias', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-pricing', label: 'Planos e preços', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-support', label: 'Suporte e treinamento', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-banner', label: 'Banner', icon: Sparkles, context: ['operational', 'admin'] },
      { id: 'product-sponsored-description', label: 'Descrição patrocinada', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-downloads', label: 'Conteúdo Baixável', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-features', label: 'Funcionalidades', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-videos', label: 'Vídeos', icon: ImageIcon, context: ['operational', 'admin'] },
      { id: 'product-images', label: 'Imagens', icon: ImageIcon, context: ['operational', 'admin'] },
    ],
  },
  {
    id: 'ranking-performance',
    label: 'Ranking Performance',
    icon: Trophy,
    context: ['operational', 'quick_access'],
    group: 'metrics',
    description: 'Performance no ranking',
  },
  {
    id: 'sector-questions',
    label: 'Perguntas',
    icon: Edit3,
    context: ['operational', 'admin'],
    group: 'management',
    description: 'Gerenciar perguntas do setor',
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: Link2,
    context: ['operational', 'admin'],
    group: 'system',
    description: 'Integrações externas',
  },
  {
    id: 'trust-widget',
    label: 'Selo de Confiança',
    icon: ShieldCheck,
    context: ['operational', 'quick_access'],
    group: 'engagement',
    description: 'Widget de confiança',
  },
  {
    id: 'avalia-badges',
    label: 'Selos Avalia Solar',
    icon: BadgeCheck,
    context: ['operational'],
    group: 'engagement',
    description: 'Gerenciar selos e badges',
  },
];

export function filterNavigationByContext(
  items: NavigationItem[],
  context: NavigationContext
): NavigationItem[] {
  return items.flatMap((item) => {
    const filteredChildren = item.children?.filter(
      (child) => child.context.includes(context) || child.context.includes('all')
    );
    const itemMatches = item.context.includes(context) || item.context.includes('all');

    if (!itemMatches && !filteredChildren?.length) {
      return [];
    }

    return [
      {
        ...item,
        children: filteredChildren,
      },
    ];
  });
}

export function getNavigationItemById(id: string): NavigationItem | undefined {
  for (const item of DASHBOARD_NAVIGATION) {
    if (item.id === id) return item;
    if (item.children) {
      const child = item.children.find((c) => c.id === id);
      if (child) return child;
    }
  }
  return undefined;
}

export function getNavigationGroups(): string[] {
  return Array.from(new Set(DASHBOARD_NAVIGATION.map((item) => item.group).filter(Boolean)));
}

export function flattenNavigationItems(items: NavigationItem[]): FlatNavigationItem[] {
  return items.flatMap((item) => {
    if (!item.children?.length) {
      return [{ ...item }];
    }

    return item.children.map((child) => ({
      ...child,
      group: child.group || item.group,
      parentId: item.id,
      parentLabel: item.label,
    }));
  });
}

export function getFlatNavigationByContext(context: NavigationContext): FlatNavigationItem[] {
  return flattenNavigationItems(filterNavigationByContext(DASHBOARD_NAVIGATION, context));
}
