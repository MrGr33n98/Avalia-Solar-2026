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
  Package,
  Settings,
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
    id: 'overview-group',
    label: 'Visão Geral',
    icon: Home,
    context: ['operational', 'quick_access'],
    group: 'main',
    children: [
      {
        id: 'overview',
        label: 'Início',
        icon: Home,
        context: ['operational', 'quick_access'],
        description: 'Visão geral do dashboard',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: TrendingUp,
        context: ['operational'],
        description: 'Métricas e estatísticas',
      },
      {
        id: 'ranking-performance',
        label: 'Ranking',
        icon: Trophy,
        context: ['operational', 'quick_access'],
        description: 'Desempenho no ranking',
      },
    ],
  },
  {
    id: 'reputation-group',
    label: 'Reputação',
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
      {
        id: 'trust-widget',
        label: 'Widget de Confiança',
        icon: ShieldCheck,
        context: ['operational', 'quick_access'],
        description: 'Widget de confiança',
      },
    ],
  },
  {
    id: 'leads-group',
    label: 'Leads & Vendas',
    icon: Target,
    context: ['operational', 'quick_access'],
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
      {
        id: 'live-inbox',
        label: 'Mensagens',
        icon: MessageCircle,
        context: ['operational', 'quick_access'],
        badge: true,
        description: 'Atender leads em tempo real',
      },
      {
        id: 'icp-config',
        label: 'Dados de Intenção',
        icon: Database,
        context: ['operational', 'quick_access'],
        description: 'Configurar réguas de qualificação ICP Solar e EV',
      },
    ],
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
        id: 'product-catalog',
        label: 'Catálogo de Produtos',
        icon: Package,
        context: ['operational', 'admin'],
        description: 'Cadastrar, publicar e organizar produtos da empresa',
      },
      {
        id: 'product-downloads',
        label: 'Projetos e Materiais',
        icon: ImageIcon,
        context: ['operational', 'admin'],
      },
      {
        id: 'media',
        label: 'Fotos e Vídeos',
        icon: ImageIcon,
        context: ['operational', 'admin'],
        description: 'Gerenciar galeria de imagens e vídeos da empresa',
      },
      {
        id: 'product-pricing',
        label: 'Planos e Preços',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-banner',
        label: 'Banner',
        icon: Sparkles,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-sponsored-description',
        label: 'Descrição Patrocinada',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-features',
        label: 'Funcionalidades',
        icon: FileText,
        context: ['operational', 'admin'],
      },
    ],
  },
  {
    id: 'settings-group',
    label: 'Configurações & Suporte',
    icon: Settings,
    context: ['operational', 'admin'],
    group: 'system',
    children: [
      {
        id: 'integrations',
        label: 'Integrações',
        icon: Link2,
        context: ['operational', 'admin'],
        description: 'Integrações externas',
      },
      {
        id: 'sector-questions',
        label: 'Perguntas',
        icon: Edit3,
        context: ['operational', 'admin'],
        description: 'Gerenciar perguntas do setor',
      },
      {
        id: 'avalia-badges',
        label: 'Selos Avalia Solar',
        icon: BadgeCheck,
        context: ['operational'],
        description: 'Gerenciar selos',
      },
      {
        id: 'product-support',
        label: 'Suporte e Treinamento',
        icon: FileText,
        context: ['operational', 'admin'],
      },
    ],
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
