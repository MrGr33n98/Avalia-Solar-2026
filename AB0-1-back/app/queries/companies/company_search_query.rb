# app/queries/companies/company_search_query.rb
module Companies
  class CompanySearchQuery
    def self.call(params, relation = ::Company.all)
      new(params, relation).call
    end

    def initialize(params, relation)
      @params = params
      @relation = relation
    end

    def call
      scope = @relation
      scope = apply_includes(scope)
      scope = apply_status(scope)
      scope = apply_search(scope)
      scope = apply_featured(scope)
      scope = apply_verified(scope)
      scope = apply_location(scope)
      scope = apply_rating(scope)
      scope = apply_categories(scope)
      scope = apply_financing_and_whatsapp(scope)
      scope = apply_sort(scope)
      scope = apply_limit(scope)
      scope
    end

    private

    def apply_includes(scope)
      scope.includes(
        :categories,
        :company_faqs,
        :company_buttons,
        :plan,
        :company_financing_profile,
        badges: { image_attachment: :blob },
        review_aggregates: [:category],
        company_financing_partners: { logo_attachment: :blob },
        company_financing_offers: []
      )
    end

    def apply_status(scope)
      if @params[:status].present?
        scope.where(status: @params[:status])
      else
        scope.where(status: ::Company.statuses[:active])
      end
    end

    def apply_search(scope)
      if @params[:q].present?
        term = @params[:q].to_s.strip
        scope = scope.search_by_text(term) if term.present?
      end
      scope
    end

    def apply_featured(scope)
      if @params[:featured].present?
        featured_val = ActiveModel::Type::Boolean.new.cast(@params[:featured])
        scope = scope.where(featured: featured_val)
      end
      scope
    end

    def apply_verified(scope)
      if @params[:verified].present?
        verified_val = ActiveModel::Type::Boolean.new.cast(@params[:verified])
        scope = scope.where(verified: verified_val)
      end
      scope
    end

    def apply_location(scope)
      # 1. Geolocation (latitude/longitude/radius_km)
      # Adaptação segura lat/lng para latitude/longitude
      coordinates = valid_coordinates
      radius = valid_radius

      if coordinates
        if radius
          scope = Geo::HaversineCalculator.scope_within_radius(
            scope,
            lat: coordinates[:lat],
            lng: coordinates[:lng],
            radius_km: radius
          )
        end
      end

      # 2. State & City filtering
      if @params[:state].present?
        states = Array(@params[:state]).flat_map { |v| v.to_s.split(',') }.map { |s| s.strip.upcase }.reject(&:blank?)
        scope = scope.where(state: states) if states.any?
      end

      if @params[:city].present?
        cities = Array(@params[:city]).flat_map { |v| v.to_s.split(',') }.map(&:strip).reject(&:blank?)
        scope = scope.where(city: cities) if cities.any?
      end

      # 3. Serving state & city
      if @params[:serves_state].present?
        states = Array(@params[:serves_state]).flat_map { |v| v.to_s.split(',') }
                                             .map { |s| ::Locations::CoverageNormalizer.normalize_state(s) }
                                             .compact
                                             .uniq
        if states.any?
          state_scope = states.reduce(::Company.none) do |acc, state|
            acc.or(::Company.serving_state(state))
          end
          scope = scope.where(id: state_scope.select(:id))
        end
      end

      if @params[:serves_city].present?
        cities = Array(@params[:serves_city]).flat_map { |v| v.to_s.split(',') }
                                            .map(&:strip)
                                            .reject(&:blank?)
                                            .uniq
        city_state = Array(@params[:serves_state]).flat_map { |v| v.to_s.split(',') }
                                                 .filter_map { |state| ::Locations::CoverageNormalizer.normalize_state(state) }
                                                 .first
        if cities.any?
          city_scope = cities.reduce(::Company.none) do |acc, served_city|
            acc.or(::Company.serving_city(served_city, city_state))
          end
          scope = scope.where(id: city_scope.select(:id))
        end
      end

      scope
    end

    def apply_rating(scope)
      scope = scope.where('rating_avg >= ?', @params[:min_rating].to_f) if @params[:min_rating].present?
      
      if @params[:has_reviews].present?
        has_reviews_val = ActiveModel::Type::Boolean.new.cast(@params[:has_reviews])
        scope = scope.where('rating_count > 0') if has_reviews_val
      end
      scope
    end

    def apply_categories(scope)
      if @params[:category_id].present?
        cat_param = @params[:category_id].to_s.strip
        target_cat_id = if cat_param.match?(/^\d+$/)
                          cat_param.to_i
                        else
                          ::Category.find_by(slug: cat_param)&.id || ::Category.find_by(seo_url: cat_param)&.id
                        end
        if target_cat_id.present?
          cat_company_ids = ::Company.joins(:categories).where(categories: { id: target_cat_id }).pluck(:id).uniq
          scope = scope.where(id: cat_company_ids)
        end
      end

      if @params[:category_ids].present?
        category_ids = Array(@params[:category_ids]).flat_map do |v|
          v.to_s.split(',')
        end.map(&:to_i).select(&:positive?)
        if category_ids.any?
          cats_company_ids = ::Company.joins(:categories).where(categories: { id: category_ids }).pluck(:id).uniq
          scope = scope.where(id: cats_company_ids)
        end
      end

      scope
    end

    def apply_financing_and_whatsapp(scope)
      if @params[:whatsapp_enabled].present?
        whatsapp_val = ActiveModel::Type::Boolean.new.cast(@params[:whatsapp_enabled])
        scope = scope.where(whatsapp_enabled: whatsapp_val)
      end

      if @params[:financing_enabled].present?
        financing_val = ActiveModel::Type::Boolean.new.cast(@params[:financing_enabled])
        scope = scope.where(financing_enabled: financing_val)
      end

      scope
    end

    def apply_sort(scope)
      if @params[:sort].present?
        valid_sorts = %w[
          rating
          rating_avg
          rating_desc
          reviews_desc
          name
          name_asc
          name_desc
          created_at
          newest
          recommended
          distance
        ]
        if valid_sorts.include?(@params[:sort])
          case @params[:sort]
          when 'rating', 'rating_avg', 'rating_desc'
            scope = scope.reorder(rating_avg: :desc, rating_count: :desc)
          when 'reviews_desc'
            scope = scope.reorder(rating_count: :desc, rating_avg: :desc)
          when 'name', 'name_asc'
            scope = scope.reorder(name: :asc)
          when 'name_desc'
            scope = scope.reorder(name: :desc)
          when 'created_at', 'newest'
            scope = scope.reorder(created_at: :desc)
          when 'distance'
            scope = apply_distance_sort(scope)
          when 'recommended'
            scope = scope.reorder(featured: :desc, rating_avg: :desc, rating_count: :desc,
                                  created_at: :desc)
          end
        else
          scope = scope.reorder(featured: :desc, rating_avg: :desc, rating_count: :desc,
                                created_at: :desc)
        end
      else
        scope = scope.reorder(rating_avg: :desc, rating_count: :desc, created_at: :desc)
      end
      scope
    end

    def apply_limit(scope)
      if @params[:limit].present? && !@params[:page].present?
        scope = scope.limit(@params[:limit].to_i)
      end
      scope
    end

    def valid_coordinates
      lat = parse_coordinate(@params[:latitude] || @params[:lat], -90.0, 90.0)
      lng = parse_coordinate(@params[:longitude] || @params[:lng], -180.0, 180.0)
      return unless lat && lng

      { lat: lat, lng: lng }
    end

    def valid_radius
      radius = parse_float(@params[:radius_km])
      radius if radius&.positive?
    end

    def parse_coordinate(value, min, max)
      coordinate = parse_float(value)
      coordinate if coordinate && coordinate.between?(min, max)
    end

    def parse_float(value)
      return if value.blank?

      number = Float(value.to_s, exception: false)
      number if number&.finite?
    end

    def apply_distance_sort(scope)
      coordinates = valid_coordinates
      return recommended_scope(scope) unless coordinates

      haversine_sql = distance_sql(coordinates)
      scope.where('latitude IS NOT NULL AND longitude IS NOT NULL')
           .select("companies.*, (#{haversine_sql}) AS distance_km")
           .reorder(Arel.sql("#{haversine_sql} ASC"))
    end

    def distance_sql(coordinates)
      lat = coordinates[:lat]
      lng = coordinates[:lng]

      <<~SQL.squish
        (6371 * acos(
          LEAST(1.0, cos(radians(#{lat}))
          * cos(radians(latitude))
          * cos(radians(longitude) - radians(#{lng}))
          + sin(radians(#{lat}))
          * sin(radians(latitude)))
        ))
      SQL
    end

    def recommended_scope(scope)
      scope.reorder(featured: :desc, rating_avg: :desc, rating_count: :desc, created_at: :desc)
    end
  end
end
