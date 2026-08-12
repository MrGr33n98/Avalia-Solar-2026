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
    ],
  },
  {
    id: 'performance-group',
    label: 'Performance',
    icon: TrendingUp,
    context: ['operational'],
    group: 'performance',
    children: [
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
      {
        id: 'avalia-badges',
        label: 'Selos Avalia Solar',
        icon: BadgeCheck,
        context: ['operational'],
        description: 'Gerenciar selos',
      },
    ],
  },
  {
    id: 'leads-group',
    label: 'Oportunidades',
    icon: Target,
    context: ['operational', 'quick_access'],
    group: 'engagement',
    children: [
      {
        id: 'leads',
        label: 'Leads',
        icon: Target,
        context: ['operational', 'quick_access'],
        badge: true,
        description: 'Gerenciar leads',
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
        label: 'Intenção de Compra',
        icon: Database,
        context: ['operational', 'quick_access'],
        description: 'Dados de intenção de compra',
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
        label: 'Produtos e Serviços',
        icon: Package,
        context: ['operational', 'admin'],
        description: 'Cadastrar, publicar e organizar produtos e serviços',
      },
      {
        id: 'product-downloads',
        label: 'Projetos',
        icon: ImageIcon,
        context: ['operational', 'admin'],
      },
      {
        id: 'materials',
        label: 'Materiais',
        icon: FileText,
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
        id: 'sector-questions',
        label: 'Perguntas',
        icon: Edit3,
        context: ['operational', 'admin'],
        description: 'Gerenciar perguntas do setor',
      },
    ],
  },
  {
    id: 'ads-group',
    label: 'Divulgação',
    icon: Sparkles,
    context: ['operational', 'admin'],
    group: 'management',
    children: [
      {
        id: 'product-banner',
        label: 'Publicidade / Avalia Solar Ads',
        icon: Sparkles,
        context: ['operational', 'admin'],
      },
      {
        id: 'product-sponsored-description',
        label: 'Descrição Patrocinada',
        icon: FileText,
        context: ['operational', 'admin'],
      },
    ],
  },
  {
    id: 'integrations-group',
    label: 'Integrações',
    icon: Link2,
    context: ['operational', 'admin'],
    group: 'system',
    children: [
      {
        id: 'integrations',
        label: 'Integração de Leads',
        icon: Link2,
        context: ['operational', 'admin'],
        description: 'Integrações externas',
      },
    ],
  },
  {
    id: 'settings-group',
    label: 'Conta',
    icon: Settings,
    context: ['operational', 'admin'],
    group: 'system',
    children: [
      {
        id: 'product-pricing',
        label: 'Plano e Assinatura',
        icon: FileText,
        context: ['operational', 'admin'],
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: Settings,
        context: ['operational', 'admin'],
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
