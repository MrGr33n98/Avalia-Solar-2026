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
} as const;

/** Proporções padrão usadas somente quando creative não informa dimensões válidas. */
export const BANNER_PLACEMENT_ASPECT_RATIOS: Record<string, string> = {
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
  company_profile_about_inline: '15/2',
  company_profile_sidebar_sponsored: '1/2',
  companies_top: '15/2',
  search_mid: '15/2',
  categories_filter_sidebar: '6/5',
  categories_right_rail: '1/2',
  companies_right_rail: '1/2',
  companies_footer: '15/2',
  article_footer_cta: '15/2',
  company_profile_related_carousel: '15/2',
  comparison_floating_bar: '6/1',
  groups_right_rail: '1/2',
};

export type BannerLocation =
  | typeof BANNER_PLACEMENTS.CATEGORY.TOP
  | typeof BANNER_PLACEMENTS.CATEGORY.FILTER_SIDEBAR
  | typeof BANNER_PLACEMENTS.CATEGORY.RIGHT_RAIL
  | typeof BANNER_PLACEMENTS.COMPANIES.TOP
  | typeof BANNER_PLACEMENTS.COMPANIES.FOOTER
  | typeof BANNER_PLACEMENTS.COMPANIES.RIGHT_RAIL
  | typeof BANNER_PLACEMENTS.GLOBAL.SIDEBAR
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
  | 'groups_right_rail';
