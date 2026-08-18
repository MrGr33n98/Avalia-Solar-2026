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
  | 'company_profile_related_carousel';
