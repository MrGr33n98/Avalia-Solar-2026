/**
 * Mobile Navigation Tokens & Configuration
 * Avalia Solar — PWA Mobile Bottom Navigation
 */

export const MOBILE_NAV_HEIGHT = 56; // 56px compact visual height (excluding safe-area)
export const MOBILE_NAV_FAB_SIZE = 44; // 44px elevated central search button
export const MOBILE_NAV_ICON_SIZE = 20; // 20px refined icon size
export const MOBILE_NAV_Z_INDEX = 50; // z-50 for proper overlay stacking

export interface MobileNavItemConfig {
  id: 'home' | 'companies' | 'search' | 'compare' | 'messages';
  label: string;
  href?: string;
  ariaLabel: string;
}

export const MOBILE_NAV_ITEMS: readonly MobileNavItemConfig[] = [
  {
    id: 'home',
    label: 'Início',
    href: '/',
    ariaLabel: 'Ir para a página inicial',
  },
  {
    id: 'companies',
    label: 'Empresas',
    href: '/companies',
    ariaLabel: 'Explorar empresas de energia solar',
  },
  {
    id: 'search',
    label: 'Buscar',
    href: '/search',
    ariaLabel: 'Buscar empresas, produtos e categorias',
  },
  {
    id: 'compare',
    label: 'Comparar',
    href: '/compare',
    ariaLabel: 'Comparar empresas selecionadas',
  },
  {
    id: 'messages',
    label: 'Mensagens',
    href: '/chat',
    ariaLabel: 'Abrir mensagens e atendimento',
  },
] as const;

/**
 * Rotas onde a navegação inferior pública deve ser ocultada para evitar conflito
 * com shells especializadas (dashboard empresarial, reviewer, chat tela cheia).
 */
export const HIDDEN_MOBILE_NAV_PREFIXES = [
  '/dashboard',
  '/review-dashboard',
  '/creator-studio',
  '/chat',
] as const;

export const HIDDEN_MOBILE_NAV_EXACT_ROUTES = [
  '/profile', // redireciona para /review-dashboard/profile
] as const;

export function shouldHideMobileNav(pathname: string | null): boolean {
  if (!pathname) return false;

  if (HIDDEN_MOBILE_NAV_EXACT_ROUTES.some((route) => pathname === route)) {
    return true;
  }

  return HIDDEN_MOBILE_NAV_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
