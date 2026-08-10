module BannerPlacements
  class Catalog
    Entry = Data.define(:key, :routes, :dimensions, :commercial, :status)
    ENTRIES = {
      'home_top' => Entry.new('home_top', ['/'], [1200, 160], 'premium', 'active'),
      'categories_top' => Entry.new('categories_top', ['/categories/*'], [1200, 300], 'premium', 'active'),
      'compare_hero' => Entry.new('compare_hero', ['/compare*'], [1200, 300], 'premium', 'active'),
      'compare_page_top' => Entry.new('compare_page_top', ['/compare*'], [1200, 160], 'premium', 'active'),
      'compare_page_inline' => Entry.new('compare_page_inline', ['/compare*'], [1200, 160], 'premium', 'active'),
      'compare_page_sidebar' => Entry.new('compare_page_sidebar', ['/compare*'], [300, 600], 'premium', 'active'),
      'company_profile_about_inline' => Entry.new('company_profile_about_inline', ['/companies/:id*'], [1200, 160], 'premium', 'active'),
      'company_profile_sidebar_sponsored' => Entry.new('company_profile_sidebar_sponsored', ['/companies/:id*'], [300, 600], 'premium', 'active'),
      'search_top' => Entry.new('search_top', ['/search*'], [1200, 180], 'premium', 'active'),
      'article_footer_cta' => Entry.new('article_footer_cta', ['/blog/*'], [1200, 160], 'premium', 'active'),
      'financing_simulator_micro_banner' => Entry.new('financing_simulator_micro_banner', ['/calculadora*'], [600, 200], 'premium', 'active'),
      'navbar' => Entry.new('navbar', ['/*'], [960, 100], 'premium', 'active'),
      'sidebar' => Entry.new('sidebar', ['/companies/:id*', '/blog/*'], [150, 125], 'premium', 'active'),
      'companies_top' => Entry.new('companies_top', ['/companies*'], [1200, 160], 'premium', 'active'),
      'companies_footer' => Entry.new('companies_footer', ['/companies*'], [1200, 160], 'premium', 'active'),
      'search_mid' => Entry.new('search_mid', ['/search*'], [1200, 160], 'premium', 'active'),
      'categories_filter_sidebar' => Entry.new('categories_filter_sidebar', ['/categories/*'], [300, 250], 'premium', 'active'),
      'categories_right_rail' => Entry.new('categories_right_rail', ['/categories/*'], [300, 600], 'premium', 'active'),
      'companies_right_rail' => Entry.new('companies_right_rail', ['/companies*'], [300, 600], 'premium', 'active'),
      'pricing_advertise_section' => Entry.new('pricing_advertise_section', ['/pricing*'], [1200, 160], 'premium', 'active'),
      'company_profile_related_carousel' => Entry.new('company_profile_related_carousel', ['/companies/:id*'], [1200, 160], 'premium', 'active'),
      'compare_page_bottom' => Entry.new('compare_page_bottom', ['/compare*'], [1200, 160], 'premium', 'active'),
      'comparison_floating_bar' => Entry.new('comparison_floating_bar', ['/compare*'], [720, 120], 'premium', 'active')
    }.freeze
    def self.keys
      ENTRIES.keys
    end

    def self.fetch(key)
      ENTRIES.fetch(key.to_s)
    end
    def self.all
      ENTRIES.values
    end
  end
end
