# frozen_string_literal: true

module Api
  module V1
    class LocalSolarPagesController < BaseController
      include Paginatable

      def show
        state = ::Locations::CoverageNormalizer.normalize_state(params[:state])
        return render json: { error: 'Localidade não encontrada' }, status: :not_found if state.blank?

        city = resolve_city(state)
        if params[:city].present? && city.blank?
          return render json: { error: 'Localidade não encontrada' },
                        status: :not_found
        end

        base_scope = local_base_scope(state, city)
        filtered_scope = apply_filters(base_scope)
        filtered_scope = apply_sort(filtered_scope)
        paginated = paginate(filtered_scope)
        set_pagination_headers(paginated)

        render json: {
          location: location_payload(state, city),
          seo: seo_payload(state, city, base_scope.exists?),
          stats: stats_payload(base_scope),
          categories: categories_payload(base_scope),
          project_types: project_types_payload(base_scope),
          featured_companies: featured_companies_payload(filtered_scope),
          companies: paginated.map { |company| company_card_payload(company) },
          nearby_locations: nearby_locations_payload(state, city),
          filters: filters_payload,
          pagination: pagination_metadata(paginated)
        }, status: :ok
      end

      private

      def resolve_city(state)
        return nil if params[:city].blank?

        ::Locations::CoverageNormalizer.resolve_city_slug(state, params[:city])
      end

      def local_base_scope(state, city)
        scope = ::Company.active.includes(
          :categories,
          :badges,
          :company_buttons,
          :plan,
          :company_financing_profile
        )

        if params[:vertical].present?
          vertical_cat = ::Category.main_categories.active.find_by(seo_url: params[:vertical])
          if vertical_cat.present?
            vertical_ids = [vertical_cat.id] + vertical_cat.children.active.pluck(:id)
            scope = scope.where(id: companies_matching_category_ids(vertical_ids))
          end
        end

        if city.present?
          scope.serving_city_strict(city, state)
        else
          scope.serving_state(state)
        end
      end

      def company_ids_for(scope)
        scope.except(:includes, :preload, :eager_load, :order)
             .reselect('companies.id')
             .distinct
      end

      def companies_matching_category_ids(category_ids)
        ::Company.joins(:categories)
                 .where(categories: { id: category_ids })
                 .select(:id)
      end

      def apply_filters(scope)
        filtered = scope

        if params[:q].present?
          term = params[:q].to_s.strip
          filtered = filtered.search_by_text(term) if term.present?
        end

        if params[:featured].present?
          filtered = filtered.where(featured: ActiveModel::Type::Boolean.new.cast(params[:featured]))
        end

        if params[:verified].present?
          filtered = filtered.where(verified: ActiveModel::Type::Boolean.new.cast(params[:verified]))
        end

        filtered = filtered.where('companies.rating_avg >= ?', params[:min_rating].to_f) if params[:min_rating].present?

        category_ids = parsed_category_ids
        filtered = filtered.where(id: companies_matching_category_ids(category_ids)) if category_ids.any?

        project_types = parsed_project_types
        if project_types.any?
          conditions = project_types.map { 'project_types @> ?::jsonb' }.join(' OR ')
          values = project_types.map { |type| [type].to_json }
          filtered = filtered.where(conditions, *values)
        end

        filtered
      end

      def apply_sort(scope)
        case params[:sort].to_s
        when 'rating', 'rating_avg', 'rating_desc'
          scope.reorder(rating_avg: :desc, rating_count: :desc, name: :asc)
        when 'reviews_desc'
          scope.reorder(rating_count: :desc, rating_avg: :desc, name: :asc)
        when 'name', 'name_asc'
          scope.reorder(name: :asc)
        when 'newest', 'created_at'
          scope.reorder(created_at: :desc)
        else
          scope.reorder(local_priority_order_sql)
        end
      end

      def local_priority_order_sql
        Arel.sql(<<~SQL.squish)
          CASE WHEN companies.sponsored THEN 1 ELSE 0 END DESC,
          CASE WHEN companies.featured THEN 1 ELSE 0 END DESC,
          CASE WHEN companies.verified THEN 1 ELSE 0 END DESC,
          COALESCE(companies.priority_score, 0) DESC,
          COALESCE(companies.rating_avg, 0) DESC,
          COALESCE(companies.rating_count, 0) DESC,
          companies.name ASC
        SQL
      end

      def parsed_category_ids
        Array(params[:category_ids]).flat_map { |value| value.to_s.split(',') }
                                    .map(&:to_i)
                                    .select(&:positive?)
                                    .uniq
      end

      def parsed_project_types
        requested = Array(params[:project_types]).flat_map { |value| value.to_s.split(',') }
                                                 .map(&:strip)
                                                 .reject(&:blank?)

        requested.filter_map do |value|
          ::Company::PROJECT_TYPES.find { |project_type| same_project_type?(project_type, value) }
        end.uniq
      end

      def location_payload(state, city)
        vertical_slug = params[:vertical].presence || 'energia-solar'
        if city.present?
          {
            scope: 'city',
            state: state,
            state_name: state_name(state),
            city: city,
            city_slug: ::Locations::CoverageNormalizer.city_slug(city),
            canonical_path: "/companies/#{vertical_slug}/#{state.downcase}/#{::Locations::CoverageNormalizer.city_slug(city)}"
          }
        else
          {
            scope: 'state',
            state: state,
            state_name: state_name(state),
            city: nil,
            city_slug: nil,
            canonical_path: "/companies/#{vertical_slug}/#{state.downcase}"
          }
        end
      end

      def seo_payload(state, city, indexable)
        locality = city.present? ? "#{city}/#{state}" : state_name(state)
        vertical_name = 'energia solar'
        if params[:vertical].present?
          vertical_cat = ::Category.main_categories.active.find_by(seo_url: params[:vertical])
          vertical_name = vertical_cat.name.downcase if vertical_cat.present?
        end
        title = "Empresas de #{vertical_name} em #{locality} | Avalia Solar"
        description = "Compare empresas de #{vertical_name} que atendem #{locality}. Veja reputação, serviços, localização e canais oficiais no Avalia Solar."

        {
          title: title,
          description: description,
          indexable: indexable
        }
      end

      def stats_payload(scope)
        {
          total_companies: scope.count,
          verified_companies: scope.where(verified: true).count,
          featured_companies: scope.where(featured: true).count,
          sponsored_companies: scope.where(sponsored: true).count,
          generated_at: Time.current.iso8601
        }
      end

      def categories_payload(scope)
        ::Category.joins(:companies)
                  .where(companies: { id: company_ids_for(scope) })
                  .group('categories.id')
                  .select('categories.*, COUNT(DISTINCT companies.id) AS local_companies_count')
                  .order(Arel.sql('local_companies_count DESC, categories.name ASC'))
                  .limit(12)
                  .map do |category|
                    {
                      id: category.id,
                      name: category.name,
                      seo_url: category.seo_url,
                      companies_count: category.read_attribute(:local_companies_count).to_i
                    }
        end
      end

      def project_types_payload(scope)
        counts = Hash.new(0)

        ::Company.where(id: company_ids_for(scope)).pluck(:project_types).each do |values|
          Array(values).each do |value|
            canonical = ::Company::PROJECT_TYPES.find { |project_type| same_project_type?(project_type, value) }
            counts[canonical] += 1 if canonical.present?
          end
        end

        ::Company::PROJECT_TYPES.map do |project_type|
          {
            name: project_type,
            companies_count: counts[project_type]
          }
        end
      end

      def featured_companies_payload(scope)
        scope.where('companies.featured = ? OR companies.sponsored = ? OR companies.verified = ?', true, true, true)
             .reorder(local_priority_order_sql)
             .limit(6)
             .map { |company| company_card_payload(company) }
      end

      def nearby_locations_payload(state, city)
        vertical_slug = params[:vertical].presence || 'energia-solar'
        scope = ::Company.active
                         .where(state: state)
                         .where.not(city: [nil, ''])

        if params[:vertical].present?
          vertical_cat = ::Category.main_categories.active.find_by(seo_url: params[:vertical])
          if vertical_cat.present?
            vertical_ids = [vertical_cat.id] + vertical_cat.children.active.pluck(:id)
            scope = scope.where(id: companies_matching_category_ids(vertical_ids))
          end
        end

        counts = scope.group(:city).count

        counts.reject { |name, _count| city.present? && same_city?(name, city) }
              .sort_by { |name, count| [-count, name.to_s] }
              .first(8)
              .map do |name, count|
                {
                  state: state,
                  city: name,
                  href: "/companies/#{vertical_slug}/#{state.downcase}/#{::Locations::CoverageNormalizer.city_slug(name)}",
                  companies_count: count
                }
        end
      end

      def filters_payload
        {
          q: params[:q].to_s,
          category_ids: parsed_category_ids,
          featured: params[:featured],
          verified: params[:verified],
          min_rating: params[:min_rating],
          sort: params[:sort].presence || 'recommended'
        }
      end

      def company_card_payload(company)
        categories = company.categories.to_a
        {
          id: company.id,
          slug: company.slug,
          name: company.name,
          city: company.city,
          state: company.state,
          rating_avg: company.rating_avg,
          rating_count: company.rating_count,
          featured: company.featured,
          verified: company.verified,
          sponsored: company.sponsored,
          logo_url: company.logo_url,
          banner_url: company.banner_url,
          primary_category: categories.first&.name,
          category_ids: categories.take(5).map(&:id),
          project_types: company.project_types || [],
          feature_access: company.respond_to?(:feature_access) ? company.feature_access : {}
        }
      end

      def same_city?(left, right)
        ::Locations::CoverageNormalizer.city_slug(left) == ::Locations::CoverageNormalizer.city_slug(right)
      end

      def same_project_type?(left, right)
        normalize_project_type(left) == normalize_project_type(right)
      end

      def normalize_project_type(value)
        I18n.transliterate(value.to_s).downcase.gsub(/[^a-z0-9]+/, ' ').squish
      end

      def state_name(state)
        ::Locations::BrLocations.states.find { |item| item['acronym'] == state }&.fetch('name', state) || state
      end
    end
  end
end
