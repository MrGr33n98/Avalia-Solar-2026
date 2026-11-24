# frozen_string_literal: true

module Mcp
  module Public
    # Read-only facades over existing Company and Category bounded contexts.
    # Never call the legacy internal MCP dispatcher: it includes admin tools.
    class DirectoryService
      class NotFound < StandardError; end

      PROFILE_ORIGIN = 'https://www.avaliasolar.com.br'
      ORDERS = {
        'relevance' => 'companies.name ASC, companies.id ASC',
        'rating' => 'companies.rating_avg DESC NULLS LAST, companies.id ASC',
        'review_count' => 'companies.rating_count DESC NULLS LAST, companies.id ASC'
      }.freeze

      def initialize(principal:)
        @principal = principal.to_s
      end

      def call(name:, arguments:)
        args = InputValidator.normalize(name, arguments)
        case name
        when 'list_integrators'
          list_integrators(args)
        when 'show_integrator_profile'
          show_integrator_profile(args)
        when 'list_solar_categories'
          list_solar_categories(args)
        else
          raise InputValidator::Invalid, 'Tool not implemented as a public directory operation.'
        end
      end

      private

      def envelope(source_type:, data:, limitations:)
        {
          schema_version: Mcp::PublicToolRegistry::CONTRACT_VERSION,
          data_as_of: Time.current.utc.iso8601,
          source_type: source_type,
          data: data,
          limitations: limitations
        }
      end

      def safe_logo_url(company)
        url = company.logo_url.to_s.strip
        url.start_with?('https://') ? url : nil
      rescue StandardError
        nil
      end

      def active_scope
        Company.active.preload(:categories)
      end

      def company_reference(args)
        scope = active_scope
        company = args.key?('company_id') ? scope.find_by(id: args.fetch('company_id')) :
                  scope.find_by(slug: args.fetch('slug'))
        raise NotFound, 'Company not found.' unless company

        company
      end

      def public_company(company, detailed: false)
        categories = company.categories.select { |cat| cat.status == 'active' }
                            .sort_by { |cat| [cat.name.to_s, cat.id] }
                            .first(20)
                            .map { |cat| { id: cat.id, name: cat.name, slug: cat.seo_url } }
        result = {
          id: company.id, name: company.name.to_s.first(160),
          slug: company.slug, profile_url: "#{PROFILE_ORIGIN}/companies/#{company.slug}",
          logo_url: safe_logo_url(company),
          headquarters: { city: company.city, state: company.state },
          declared_coverage: {
            states: company.coverage_state_list.first(27),
            cities: company.coverage_city_list.first(80)
          },
          verification_state: company.verified? ? 'platform_verified' : 'unverified',
          rating_average: company.rating_count.to_i.positive? ? company.rating_avg&.to_f : nil,
          rating_count: company.rating_count.to_i,
          categories: categories
        }
        if detailed
          if ENV['MCP_BRAND_PROFILE_HERO_ENABLED'] == 'true'
            result[:hero_carousel] = BrandHeroSnapshot.call(company)
          end
          if ENV['MCP_BRAND_PROFILE_PORTFOLIO_ENABLED'] == 'true'
            result[:portfolio_preview] = ProjectPortfolioSnapshot.call(company)
          end
          if ENV['MCP_BRAND_PROFILE_GALLERY_ENABLED'] == 'true'
            result[:gallery_preview] = CompanyGallerySnapshot.call(company)
          end
          result[:description] = ActionController::Base.helpers.strip_tags(company.description.to_s).first(1200)
          result[:services] = Array(company.services_offered).select { |item| item.is_a?(String) }
                                               .map { |item| item.first(120) }.first(20)
        end
        result
      end

      def list_integrators(args)
        filters = args.except('limit', 'cursor')
        limit = args.fetch('limit')
        offset = Cursor.decode(args['cursor'], scope: 'list_integrators',
                              filters: filters, principal: @principal)
        scope = active_scope
        if args['query'].present?
          q = "%#{ActiveRecord::Base.sanitize_sql_like(args['query'])}%"
          scope = scope.where('companies.name ILIKE :q OR companies.slug ILIKE :q', q: q)
        end
        if args['category_slug'].present?
          category = Category.active.find_by(seo_url: args['category_slug'])
          raise InputValidator::Invalid, 'Unknown category slug.' unless category

          scope = scope.joins(:categories).where(categories: { id: category.id })
        end
        if args['headquarters_city'].present?
          scope = scope.where('LOWER(companies.city) = LOWER(?)', args['headquarters_city'])
        end
        scope = scope.where('UPPER(companies.state) = ?', args['state']) if args['state'].present?
        scope = scope.where(verified: args['verified']) if args.key?('verified')
        sorted = scope.distinct.order(Arel.sql(ORDERS.fetch(args.fetch('sort'))))
        page = sorted.offset(offset).limit(limit + 1).to_a
        has_more = page.length > limit
        next_cursor = if has_more
                        Cursor.encode(offset: offset + limit, scope: 'list_integrators',
                                      filters: filters, principal: @principal)
                      end
        envelope(
          source_type: 'company_declared',
          data: { integrators: page.first(limit).map { |company| public_company(company) },
                  next_cursor: next_cursor },
          limitations: ['Cidade da sede não comprova cobertura de atendimento.',
                        'Informações declaradas e avaliações devem ser verificadas na página pública.']
        )
      end

      def show_integrator_profile(args)
        company = company_reference(args)
        envelope(
          source_type: 'company_declared',
          data: { integrator: public_company(company, detailed: true) },
          limitations: ['Cobertura geográfica informada pela empresa, não necessariamente verificada.']
        )
      end

      def list_solar_categories(args)
        filters = args.except('limit', 'cursor')
        limit = args.fetch('limit')
        offset = Cursor.decode(args['cursor'], scope: 'list_solar_categories',
                              filters: filters, principal: @principal)
        scope = Category.active
        scope = scope.where(parent_id: args['parent_id']) if args.key?('parent_id')
        page = scope.order(name: :asc, id: :asc).offset(offset).limit(limit + 1).to_a
        has_more = page.length > limit
        next_cursor = if has_more
                        Cursor.encode(offset: offset + limit, scope: 'list_solar_categories',
                                      filters: filters, principal: @principal)
                      end
        categories = page.first(limit).map do |category|
          {
            id: category.id, name: category.name, slug: category.seo_url,
            description: ActionController::Base.helpers.strip_tags(category.description.to_s).first(500),
            parent_id: category.parent_id, vertical: nil
          }
        end
        envelope(source_type: 'platform_derived',
                 data: { categories: categories, next_cursor: next_cursor },
                 limitations: ['O campo vertical é desconhecido até que a taxonomia seja formalmente validada.'])
      end
    end
  end
end
