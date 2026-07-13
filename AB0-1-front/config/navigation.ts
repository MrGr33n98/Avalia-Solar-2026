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
  MessageCircle,
  QrCode,
  Grid2X2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavigationContext = 'operational' | 'quick_access' | 'admin' | 'all';

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
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
    label: 'Início',
    icon: Home,
    context: ['operational', 'quick_access'],
    group: 'main',
    description: 'Visão geral do dashboard',
  },
  {
    id: 'analytics-group',
    label: 'Análises',
    icon: BarChart3,
    context: ['operational'],
    group: 'metrics',
    children: [
      {
        id: 'analytics',
        label: 'Análises',
        icon: TrendingUp,
        context: ['operational'],
        description: 'Métricas e estatísticas',
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
        description: 'Gerenciar avaliações de clientes',
      },
      {
        id: 'review-forms',
        label: 'Coletar Avaliações',
        icon: QrCode,
        context: ['operational', 'quick_access'],
        description: 'Criar formulários, links e QR Codes de avaliação',
      },
    ],
  },
  {
    id: 'interaction-group',
    label: 'Dados de Intenção',
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
        description: 'Gerenciar leads e oportunidades',
      },
    ],
  },
  {
    id: 'chat',
    label: 'Atendimento',
    icon: MessageCircle,
    context: ['operational', 'quick_access'],
    group: 'engagement',
    badge: true,
    description: 'Chat, WhatsApp e status online',
  },
  {
    id: 'product-edit-group',
    label: 'Perfil da Empresa',
    icon: Edit3,
    context: ['operational', 'admin'],
    group: 'management',
    children: [
      {
        id: 'product-general',
        label: 'Informações Gerais',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-categories',
        label: 'Categorias',
        icon: Grid2X2,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-pricing',
        label: 'Planos e Preços',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-support',
        label: 'Suporte e Treinamento',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      { id: 'product-banner', label: 'Banner', icon: Sparkles, context: ['operational', 'admin'] },
      {
        id: 'product-sponsored-description',
        label: 'Descrição Patrocinada',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-downloads',
        label: 'Conteúdo Baixável',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-features',
        label: 'Funcionalidades',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      { id: 'product-videos', label: 'Vídeos', icon: ImageIcon, context: ['operational', 'admin'] },
      {
        id: 'product-images',
        label: 'Imagens',
        icon: ImageIcon,
        context: ['operational', 'admin'],
      },
    ],
  },
  {
    id: 'ranking-performance',
    label: 'Performance no Ranking',
    icon: Trophy,
    context: ['operational', 'quick_access'],
    group: 'metrics',
    description: 'Desempenho no ranking',
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
    label: 'Widget de Confiança',
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
    description: 'Gerenciar selos',
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
  return Array.from(
    new Set(
      DASHBOARD_NAVIGATION.map((item) => item.group).filter((group): group is string =>
        Boolean(group)
      )
    )
  );
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
