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
    label: 'Reviews',
    icon: Star,
    context: ['operational', 'quick_access'],
    group: 'engagement',
    children: [
      { 
        id: 'reviews', 
        label: 'Reviews', 
        icon: Star, 
        context: ['operational', 'quick_access'],
        badge: true,
        description: 'Gerenciar avaliações de clientes' 
      },
    ],
  },
  {
    id: 'interaction-group',
    label: 'Interaction Data',
    icon: Database,
    context: ['operational'],
    group: 'engagement',
    children: [
      { 
        id: 'leads', 
        label: 'Opportunities', 
        icon: Target, 
        context: ['operational', 'quick_access'],
        badge: true,
        description: 'Gerenciar leads e oportunidades' 
      },
    ],
  },
  {
    id: 'product-edit-group',
    label: 'Company Profile',
    icon: Edit3,
    context: ['operational', 'admin'],
    group: 'management',
    children: [
      { id: 'product-general', label: 'General Information', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-categories', label: 'Categories', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-pricing', label: 'Plans & Pricing', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-support', label: 'Support & Training', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-banner', label: 'Banner', icon: Sparkles, context: ['operational', 'admin'] },
      { id: 'product-sponsored-description', label: 'Sponsored Description', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-downloads', label: 'Downloadable Content', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-features', label: 'Features', icon: FileText, context: ['operational', 'admin'] },
      { id: 'product-videos', label: 'Videos', icon: ImageIcon, context: ['operational', 'admin'] },
      { id: 'product-images', label: 'Images', icon: ImageIcon, context: ['operational', 'admin'] },
    ],
  },
  {
    id: 'ranking-performance',
    label: 'Ranking Performance',
    icon: Trophy,
    context: ['operational', 'quick_access'],
    group: 'metrics',
    description: 'Ranking performance',
  },
  {
    id: 'sector-questions',
    label: 'Questions',
    icon: Edit3,
    context: ['operational', 'admin'],
    group: 'management',
    description: 'Manage sector questions',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link2,
    context: ['operational', 'admin'],
    group: 'system',
    description: 'External integrations',
  },
  {
    id: 'trust-widget',
    label: 'Trust Widget',
    icon: ShieldCheck,
    context: ['operational', 'quick_access'],
    group: 'engagement',
    description: 'Trust widget',
  },
  {
    id: 'avalia-badges',
    label: 'Avalia Solar Badges',
    icon: BadgeCheck,
    context: ['operational'],
    group: 'engagement',
    description: 'Manage badges',
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
  return Array.from(new Set(DASHBOARD_NAVIGATION.map((item) => item.group).filter((group): group is string => Boolean(group))));
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
