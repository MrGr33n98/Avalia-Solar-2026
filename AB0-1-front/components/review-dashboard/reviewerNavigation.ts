import {
  Home,
  User,
  Star,
  PenLine,
  Settings as SettingsIcon,
  HelpCircle,
  Bell,
  Gift,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface ReviewerNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  matchPath: string | string[];
  section: 'main' | 'system';
  mobilePriority: number; // 1-5 = bottom nav, 6+ = drawer "Mais"
  analyticsKey: string;
  badge?: 'dot' | number;
}

export const reviewerNavItems: ReviewerNavItem[] = [
  {
    id: 'dashboard',
    label: 'Meu painel',
    href: '/review-dashboard',
    icon: Home,
    matchPath: '/review-dashboard',
    section: 'main',
    mobilePriority: 1,
    analyticsKey: 'reviewer_nav_dashboard',
  },
  {
    id: 'profile',
    label: 'Meu perfil',
    href: '/review-dashboard/profile',
    icon: User,
    matchPath: '/review-dashboard/profile',
    section: 'main',
    mobilePriority: 6,
    analyticsKey: 'reviewer_nav_profile',
  },
  {
    id: 'reviews',
    label: 'Avaliações',
    href: '/review-dashboard/reviews',
    icon: Star,
    matchPath: '/review-dashboard/reviews',
    section: 'main',
    mobilePriority: 2,
    analyticsKey: 'reviewer_nav_reviews',
  },
  {
    id: 'publications',
    label: 'Publicações',
    href: '/review-dashboard/publications',
    icon: PenLine,
    matchPath: '/review-dashboard/publications',
    section: 'main',
    mobilePriority: 7,
    analyticsKey: 'reviewer_nav_publications',
  },
  {
    id: 'solutions',
    label: 'Soluções que uso',
    href: '/review-dashboard/solutions',
    icon: Zap,
    matchPath: '/review-dashboard/solutions',
    section: 'main',
    mobilePriority: 3,
    analyticsKey: 'reviewer_nav_solutions',
  },
  {
    id: 'achievements',
    label: 'Conquistas',
    href: '/review-dashboard/achievements',
    icon: Trophy,
    matchPath: '/review-dashboard/achievements',
    section: 'main',
    mobilePriority: 4,
    analyticsKey: 'reviewer_nav_achievements',
  },
  {
    id: 'rewards',
    label: 'Recompensas',
    href: '/review-dashboard/rewards',
    icon: Gift,
    matchPath: '/review-dashboard/rewards',
    section: 'main',
    mobilePriority: 8,
    analyticsKey: 'reviewer_nav_rewards',
  },
  {
    id: 'notifications',
    label: 'Notificações',
    href: '/review-dashboard/notifications',
    icon: Bell,
    matchPath: '/review-dashboard/notifications',
    section: 'main',
    mobilePriority: 9,
    analyticsKey: 'reviewer_nav_notifications',
    badge: 'dot',
  },
  {
    id: 'settings',
    label: 'Configurações',
    href: '/review-dashboard/settings',
    icon: SettingsIcon,
    matchPath: '/review-dashboard/settings',
    section: 'system',
    mobilePriority: 10,
    analyticsKey: 'reviewer_nav_settings',
  },
  {
    id: 'help',
    label: 'Ajuda e suporte',
    href: '/review-dashboard/help',
    icon: HelpCircle,
    matchPath: '/review-dashboard/help',
    section: 'system',
    mobilePriority: 11,
    analyticsKey: 'reviewer_nav_help',
  },
];

/** Items para o bottom nav mobile (mobilePriority 1-4 + "Mais") */
export const mobileBottomNavItems = reviewerNavItems.filter(
  (item) => item.mobilePriority <= 4
);

/** Items para o drawer "Mais" no mobile */
export const mobileDrawerItems = reviewerNavItems.filter(
  (item) => item.mobilePriority > 4
);

/** Verifica se um pathname está ativo para um item de navegação */
export function isNavItemActive(pathname: string, item: ReviewerNavItem): boolean {
  const paths = Array.isArray(item.matchPath) ? item.matchPath : [item.matchPath];
  // Rota raiz: match exato
  if (item.id === 'dashboard') {
    return pathname === '/review-dashboard' || pathname === '/review-dashboard/';
  }
  return paths.some((p) => pathname.startsWith(p));
}

/** Mapa de redirects para rotas legadas */
export const legacyRedirects: Record<string, string> = {
  '/dashboard/reviewer': '/review-dashboard',
  '/dashboard/reviewer/reviews': '/review-dashboard/reviews',
  '/dashboard/reviewer/achievements': '/review-dashboard/achievements',
  '/dashboard/reviewer/profile': '/review-dashboard/profile',
  '/dashboard/reviewer/notifications': '/review-dashboard/notifications',
  '/review-dashboard/companies': '/companies',
  '/review-dashboard/green-score': '/review-dashboard',
  '/review-dashboard/journey': '/review-dashboard',
  '/review-dashboard/proposals': '/review-dashboard',
};
