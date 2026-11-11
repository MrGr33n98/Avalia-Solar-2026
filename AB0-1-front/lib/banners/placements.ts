export const BANNER_PLACEMENTS = {
  CATEGORY: {
    TOP: 'categories_top',
    FILTER_SIDEBAR: 'categories_filter_sidebar',
    RIGHT_RAIL: 'categories_right_rail',
  },
  COMPANIES: {
    TOP: 'companies_top',
    FOOTER: 'companies_footer',
    RIGHT_RAIL: 'companies_right_rail',
  },
  GLOBAL: {
    SIDEBAR: 'sidebar',
  },
  HOME: {
    HERO: 'home_hero',
    TOP: 'home_top',
  },
} as const;

/** Conjunto canônico de placements laterais/verticais (largura máxima restrita a 300px). */
export const SIDEBAR_PLACEMENTS = new Set<string>([
  'compare_page_sidebar',
  'company_profile_sidebar_sponsored',
  'companies_right_rail',
  'categories_right_rail',
  'categories_filter_sidebar',
  'sidebar',
  'groups_right_rail',
  'company_access_sidebar',
]);

/** Conjunto canônico de placements horizontais (largura total 100%, sem limite de 300px). */
export const HORIZONTAL_PLACEMENTS = new Set<string>([
  'company_profile_about_inline',
  'company_profile_related_carousel',
  'companies_top',
  'companies_footer',
  'categories_top',
  'home_hero',
  'home_top',
  'compare_hero',
  'compare_page_top',
  'compare_page_inline',
  'compare_page_bottom',
  'search_top',
  'search_mid',
  'article_footer_cta',
  'navbar',
  'financing_simulator_micro_banner',
  'comparison_floating_bar',
]);

/**
 * Determina se uma posição pertence aos placements de sidebar/lateral.
 */
export function isSidebarPlacement(position?: string): boolean {
  if (!position) return false;
  return SIDEBAR_PLACEMENTS.has(position);
}

/**
 * Determina se uma posição pertence aos placements horizontais.
 * Nunca assume automaticamente posições desconhecidas como sidebar.
 */
export function isHorizontalPlacement(position?: string): boolean {
  if (!position) return true;
  return !isSidebarPlacement(position);
}

/** Proporções padrão usadas somente quando creative não informa dimensões válidas. */
export const BANNER_PLACEMENT_ASPECT_RATIOS: Record<string, string> = {
  home_hero: '133/23',
  navbar: '10/1',
  financing_simulator_micro_banner: '3/1',
  sidebar: '6/5',
  categories_top: '4/1',
  compare_hero: '16/7',
  compare_page_sidebar: '1/2',
  compare_page_top: '15/2',
  compare_page_inline: '15/2',
  compare_page_bottom: '15/2',
  search_top: '20/3',
  home_top: '15/2',
  company_profile_about_inline: '4/1',
  company_profile_sidebar_sponsored: '1/2',
  companies_top: '15/2',
  search_mid: '15/2',
  categories_filter_sidebar: '6/5',
  categories_right_rail: '1/2',
  companies_right_rail: '1/2',
  companies_footer: '15/2',
  article_footer_cta: '15/2',
  company_profile_related_carousel: '4/1',
  comparison_floating_bar: '6/1',
  groups_right_rail: '1/2',
  company_access_sidebar: '6/5',
};

export interface PlacementDisplaySpec {
  aspectRatioClass?: string;
  defaultAspectRatio?: string;
  mobileAspectRatio?: string;
  tabletAspectRatio?: string;
  desktopAspectRatio?: string;
  mobileMinHeight?: number;
  tabletMinHeight?: number;
  desktopMaxHeight?: number;
  fit?: 'contain' | 'cover';
  ambientBackground?: boolean;
  ignoreCreativeDimensions?: boolean;
}

export const BANNER_PLACEMENT_DISPLAY_SPECS: Record<string, PlacementDisplaySpec> = {
  home_hero: {
    aspectRatioClass: 'aspect-[39/23] md:aspect-[133/23]',
    defaultAspectRatio: '133/23',
    mobileAspectRatio: '39/23',
    desktopAspectRatio: '133/23',
    fit: 'contain',
    ambientBackground: false,
  },
  company_profile_about_inline: {
    aspectRatioClass: 'aspect-[3/1] md:aspect-[3.5/1] lg:aspect-[4/1]',
    defaultAspectRatio: '4/1',
    mobileAspectRatio: '3/1',
    tabletAspectRatio: '3.5/1',
    desktopAspectRatio: '4/1',
    mobileMinHeight: 90,
    desktopMaxHeight: 220,
    fit: 'cover',
    ambientBackground: true,
    ignoreCreativeDimensions: true,
  },
  company_profile_related_carousel: {
    aspectRatioClass: 'aspect-[3/1] md:aspect-[3.5/1] lg:aspect-[4/1]',
    defaultAspectRatio: '4/1',
    mobileAspectRatio: '3/1',
    tabletAspectRatio: '3.5/1',
    desktopAspectRatio: '4/1',
    fit: 'cover',
    ambientBackground: true,
  },
  compare_page_sidebar: {
    aspectRatioClass: 'hidden xl:block w-full max-w-[300px] mx-auto aspect-[1/2]',
    defaultAspectRatio: '1/2',
    desktopAspectRatio: '1/2',
    desktopMaxHeight: 600,
    fit: 'contain',
    ambientBackground: false,
  },
  company_profile_sidebar_sponsored: {
    aspectRatioClass: 'w-full max-w-[300px] mx-auto aspect-[1/2]',
    defaultAspectRatio: '1/2',
    desktopAspectRatio: '1/2',
    desktopMaxHeight: 600,
    fit: 'contain',
    ambientBackground: false,
  },
  companies_right_rail: {
    aspectRatioClass: 'w-full max-w-[300px] mx-auto aspect-[1/2]',
    defaultAspectRatio: '1/2',
    desktopAspectRatio: '1/2',
    desktopMaxHeight: 600,
    fit: 'contain',
    ambientBackground: false,
  },
  categories_right_rail: {
    aspectRatioClass: 'w-full max-w-[300px] mx-auto aspect-[1/2]',
    defaultAspectRatio: '1/2',
    desktopAspectRatio: '1/2',
    desktopMaxHeight: 600,
    fit: 'contain',
    ambientBackground: false,
  },
  company_access_sidebar: {
    aspectRatioClass: 'w-full max-w-[300px] mx-auto aspect-[6/5]',
    defaultAspectRatio: '6/5',
    desktopAspectRatio: '6/5',
    desktopMaxHeight: 250,
    fit: 'contain',
    ambientBackground: false,
  },
};

export function getPlacementDisplaySpec(position?: string): PlacementDisplaySpec | undefined {
  if (!position) return undefined;
  return BANNER_PLACEMENT_DISPLAY_SPECS[position];
}

export type BannerLocation =
  | typeof BANNER_PLACEMENTS.CATEGORY.TOP
  | typeof BANNER_PLACEMENTS.CATEGORY.FILTER_SIDEBAR
  | typeof BANNER_PLACEMENTS.CATEGORY.RIGHT_RAIL
  | typeof BANNER_PLACEMENTS.COMPANIES.TOP
  | typeof BANNER_PLACEMENTS.COMPANIES.FOOTER
  | typeof BANNER_PLACEMENTS.COMPANIES.RIGHT_RAIL
  | typeof BANNER_PLACEMENTS.GLOBAL.SIDEBAR
  | 'home_hero'
  | 'home_top'
  | 'navbar'
  | 'article_footer_cta'
  | 'search_top'
  | 'search_mid'
  | 'compare_hero'
  | 'compare_page_top'
  | 'compare_page_inline'
  | 'compare_page_sidebar'
  | 'compare_page_bottom'
  | 'comparison_floating_bar'
  | 'financing_simulator_micro_banner'
  | 'company_profile_about_inline'
  | 'company_profile_sidebar_sponsored'
  | 'company_profile_related_carousel'
  | 'groups_right_rail'
  | 'company_access_sidebar';
