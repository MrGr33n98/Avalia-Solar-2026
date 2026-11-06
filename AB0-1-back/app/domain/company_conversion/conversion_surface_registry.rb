# frozen_string_literal: true

module CompanyConversion
  # Code-first registry: these are candidate placements, NOT promises of
  # visibility, leads, impressions or even E2E-certified live components.
  class ConversionSurfaceRegistry
    VERSION = '2.0.0'
    LIFECYCLES = %w[active conditional legacy retired].freeze
    CHANNELS = %w[quote whatsapp].freeze

    ENTRIES = [
      { id: 'CV-HOME-REC', group: 'Landing', route: '/', component: 'RecommendedCompanyCard',
        channels: %w[quote], lifecycle: 'active', variant_group: 'home_recommendations' },
      { id: 'CV-DIR-GRID', group: 'Diretório e busca', route: '/companies', component: 'CompanyCard',
        channels: %w[quote whatsapp], lifecycle: 'active', variant_group: 'directory_card' },
      { id: 'CV-DIR-LIST', group: 'Diretório e busca', route: '/search', component: 'SearchCompanyListCard',
        channels: %w[quote], lifecycle: 'active', variant_group: 'directory_list' },
      { id: 'CV-SEARCH-EXPLORE', group: 'Diretório e busca', route: '/search', component: 'SearchExploreView',
        channels: %w[quote whatsapp], lifecycle: 'conditional', variant_group: 'directory_card' },
      { id: 'CV-CAT-FEATURED', group: 'Categorias', route: '/categories/:slug', component: 'FeaturedCompanyCard',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'category_featured' },
      { id: 'CV-CAT-RANK', group: 'Categorias', route: '/categories/:slug', component: 'TopRankingSection',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'category_ranking' },
      { id: 'CV-CAT-TABLE', group: 'Categorias', route: '/categories/:slug', component: 'CategoryCompaniesTable',
        channels: %w[quote], lifecycle: 'active', variant_group: 'category_table' },
      { id: 'CV-CAT-GRID', group: 'Categorias', route: '/categories/:slug', component: 'CompaniesGrid',
        channels: %w[quote whatsapp], lifecycle: 'conditional', variant_group: 'category_grid' },
      { id: 'CV-CAT-SPONSORED', group: 'Categorias', route: '/categories/:slug', component: 'SponsoredSection',
        channels: %w[quote whatsapp], lifecycle: 'conditional', variant_group: 'category_sponsored' },
      { id: 'CV-BRAND-HERO', group: 'Brand Page', route: '/companies/:id', component: 'CompanyCTAGroup',
        channels: %w[quote whatsapp], lifecycle: 'active', variant_group: 'brand_hero' },
      { id: 'CV-BRAND-STICKY', group: 'Brand Page', route: '/companies/:id', component: 'StickyCTA',
        channels: %w[quote], lifecycle: 'legacy', variant_group: 'brand_hero' },
      { id: 'CV-BRAND-TOP1', group: 'Brand Page', route: '/companies/:id', component: 'Top1StickyCTA',
        channels: %w[quote], lifecycle: 'legacy', variant_group: 'brand_top1' },
      { id: 'CV-RELATED-CARD', group: 'Relacionadas', route: '/companies/:id', component: 'RelatedCompanyCard',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'related_companies' },
      { id: 'CV-RELATED-TABLE', group: 'Relacionadas', route: '/companies/:id', component: 'RelatedCompaniesTable',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'related_companies' },
      { id: 'CV-COMPARE-TABLE', group: 'Comparador', route: '/compare', component: 'CompareTable',
        channels: %w[quote], lifecycle: 'active', variant_group: 'compare' },
      { id: 'CV-COMPARE-BEST', group: 'Comparador', route: '/compare', component: 'BestMatchCard',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'compare' },
      { id: 'CV-COMPARE-CARD', group: 'Comparador', route: '/compare', component: 'CompanyComparisonCard',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'compare' },
      { id: 'CV-COMPARE-MODAL', group: 'Comparador', route: '/compare', component: 'CompanyComparisonModal',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'compare' },
      { id: 'CV-PRODUCT-QUICK', group: 'Produtos e serviços', route: '/products/:slug', component: 'ProductQuickView',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'product_quick' },
      { id: 'CV-PRODUCT-DETAIL', group: 'Produtos e serviços', route: '/products/:slug', component: 'ProductDetailClient',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'product_detail' },
      { id: 'CV-PRODUCT-STICKY', group: 'Produtos e serviços', route: '/products/:slug', component: 'ProductDetailClientSticky',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'product_detail' },
      { id: 'CV-CHAT-REC', group: 'Chat', route: '/chat', component: 'ChatCompanyReferenceCard',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'chat_recommendation' },
      { id: 'CV-NATIVE-PROFILE', group: 'App mobile', route: '/company/:id', component: 'NativeCompanyDetail',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'native_profile' },
      { id: 'CV-NATIVE-SERVICE', group: 'App mobile', route: '/company/:id/services', component: 'NativeCompanyServices',
        channels: %w[quote], lifecycle: 'conditional', variant_group: 'native_services' },
    ].map { |entry| entry.merge(channels: entry.fetch(:channels).freeze).freeze }.freeze

    def self.all
      ENTRIES
    end

    def self.ids
      @ids ||= ENTRIES.map { |entry| entry.fetch(:id) }.freeze
    end

    # Controlled release-list; entries require runtime E2E certification before
    # being counted as commercially active on a company's dashboard.
    def self.certified_ids
      ENV.fetch('CONVERSION_CERTIFIED_SURFACE_IDS', '').split(',').map(&:strip) & ids
    end

    def self.validate!
      raise 'Duplicate conversion surface id' unless ids.uniq.size == ENTRIES.size
      raise 'Unexpected conversion surface count' unless ENTRIES.size == 24

      ENTRIES.each do |entry|
        raise 'Invalid lifecycle' unless LIFECYCLES.include?(entry[:lifecycle])
        raise 'Invalid channel' unless entry[:channels].present? && (entry[:channels] - CHANNELS).empty?
        raise 'Empty variant group' if entry[:variant_group].blank?
      end
      true
    end
  end
end
