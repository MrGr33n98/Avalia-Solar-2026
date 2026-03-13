# app/controllers/api/v1/companies_controller.rb
module Api
  module V1
    class CompaniesController < BaseController
      include Paginatable # TASK-017: Enable pagination

      before_action :set_company,
                    only: %i[show update destroy analytics_historical analytics_reviews analytics_competitors analytics_traffic categories
                             social_proof]
      before_action :authenticate_api_user,
                    only: %i[update destroy request_admin_access analytics_historical analytics_reviews analytics_competitors
                             analytics_traffic mine]
      before_action :authorize_company_update!, only: %i[update destroy request_admin_access]
      before_action :authorize_company_scope!,
                    only: %i[analytics_historical analytics_reviews analytics_competitors analytics_traffic]

      # GET /api/v1/companies
      def index
        Rails.logger.info("Starting companies#index with params: #{params.inspect}")

        # Generate cache key based on filters
        cache_key = generate_cache_key(params)
        
        # Use Rails.cache with versioned keys
        result = Rails.cache.fetch(cache_key, expires_in: cache_ttl_for_params(params)) do
          fetch_companies_data
        end

        if params[:page].present?
          render json: result, status: :ok
        else
          render json: result, status: :ok
        end
      rescue StandardError => e
        Rails.logger.error("Error in companies#index: #{e.message}")
        render json: { error: 'Internal server error' }, status: :internal_server_error
      end

      # GET /api/v1/companies/featured
      def featured
        cache_key = "companies_featured_v1"
        @companies = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
          ::Company.active.where(featured: true).limit(10).to_a
        end
        companies_json = @companies.map do |company|
          company_json_attributes(company)
        end
        render json: companies_json
      end

      # GET /api/v1/companies/mine
      def mine
        # Use a relation directly to avoid loading everything into memory at once
        companies_scope = current_user.active_member_companies.includes(:categories)

        if params[:q].present?
          term = params[:q].to_s.strip
          companies_scope = companies_scope.where(
            'LOWER(companies.name) LIKE LOWER(:q) OR LOWER(companies.city) LIKE LOWER(:q)', q: "%#{term}%"
          )
        end

        # Cache for 5 minutes as requested, handle cache failures gracefully
        cache_key = "user_#{current_user.id}_companies_mine_#{Digest::SHA1.hexdigest(params[:q].to_s)}"

        begin
          companies_data = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
            fetch_mine_companies_data(companies_scope)
          end
        rescue StandardError => e
          Rails.logger.error("[CompaniesController#mine] Cache error: #{e.message}")
          companies_data = fetch_mine_companies_data(companies_scope)
        end

        render json: companies_data
      end

      # GET /api/v1/companies/:id
      def show
        return render json: { error: 'Company not found' }, status: :not_found unless @company

        render json: { company: company_detail_payload(@company) }, status: :ok
      end

      # GET /api/v1/companies/by_slug/:slug
      def show_by_slug
        company = find_company_by_id_or_slug(params[:slug])
        return render json: { error: 'Company not found' }, status: :not_found unless company

        render json: { company: company_detail_payload(company) }, status: :ok
      end

      # GET /api/v1/companies/:id/categories
      def categories
        cats = @company.categories.select(:id, :name, :seo_url, :status, :featured, :created_at, :updated_at)
        render json: { categories: cats.as_json }, status: :ok
      end

      # GET /api/v1/companies/:id/social_proof
      def social_proof
        limit = params[:limit].to_i
        limit = 3 if limit <= 0
        limit = [limit, 10].min

        unless @company.can_use_social_proof?
          return render json: empty_social_proof_payload(@company, limit: limit), status: :ok
        end

        cache_key = Review.social_proof_cache_key(@company.id, limit: limit)
        payload = Rails.cache.fetch(cache_key, expires_in: 20.minutes) do
          base_scope = @company.reviews.includes(:user).for_social_proof
          selected = base_scope.limit(limit)

          {
            company_id: @company.id,
            company_slug: @company.slug,
            total_featured_reviews: base_scope.count,
            generated_at: Time.current.iso8601,
            reviews: selected.map { |review| social_proof_review_payload(review) }
          }
        end

        render json: payload, status: :ok
      end

      # POST /api/v1/companies
      def create
        Rails.logger.info "[Audit] Initing company creation. Params: #{company_params.except(:logo).inspect}"
        @company = ::Company.new(company_params)

        # Injeta localização da borda (Cloudflare) se não fornecida e verificada
        if @edge_location.present?
          @company.city = @edge_location[:city] if @company.city.blank?
          @company.state = @edge_location[:state] if @company.state.blank?

          # Log para auditoria se a localização foi injetada pela borda
          if @edge_verified
            Rails.logger.info "[Audit] Edge Verified Location applied to Company ID #{@company.id}: #{@company.city}/#{@company.state}"
          end
        end

        @company.status = 'pending' if @company.status.blank?

        if params[:company][:logo].present?
          Rails.logger.info "[Audit] Company logo detected in request for new company: #{@company.name}"
        end

        begin
          ::Company.transaction do
            if @company.save
              # Track event
              Analytics::TrackEventService.call(
                company_id: @company.id,
                user: current_user,
                event_type: 'company_created',
                metadata: request_metadata.merge(
                  status: @company.status,
                  city: @company.city,
                  state: @company.state
                )
              )

              if current_user
                PostHog.capture(
                  distinct_id: current_user.posthog_distinct_id,
                  event: 'company_registered',
                  properties: {
                    company_id: @company.id,
                    company_name: @company.name,
                    city: @company.city,
                    state: @company.state,
                    status: @company.status,
                    plan_tier: @company.respond_to?(:inferred_plan_tier) ? @company.inferred_plan_tier : 'free',
                    company_segment: @company.respond_to?(:project_types) ? @company.project_types&.join(',') : nil
                  }
                )
              end

              Rails.logger.info "[Audit] Company created successfully: ID #{@company.id}, Name: #{@company.name}"

              if @company.logo.attached?
                Rails.logger.info "[Audit] Photo Flow: Company logo attached successfully for ID #{@company.id}"
              end

              # FIX #2: Criar CompanyMember owner automaticamente no companies#create com transação
              if current_user
                @company.company_members.create!(
                  user: current_user,
                  role: :owner
                )
                Rails.logger.info "[Audit] User ID #{current_user.id} assigned as owner of Company ID #{@company.id}"
              end

              PendingChange.create!(
                company: @company,
                user_id: current_user&.id,
                change_type: 'company_create',
                data: { requested_at: Time.current },
                status: 'pending'
              )

              begin
                AdminUser.find_each do |admin|
                  NotificationMailer.admin_alert(
                    admin.email,
                    'Nova empresa cadastrada',
                    "Empresa #{@company.name} criada com status pendente em #{Time.current}"
                  ).deliver_later
                end

                # Send confirmation email to company
                ::CompanyMailer.registration_received(@company).deliver_later
              rescue StandardError => e
                Rails.logger.warn "[Audit] Notification failure: #{e.message}"
              end

              company_json = {
                id: @company.id,
                slug: @company.slug,
                name: @company.name,
                description: @company.description,
                website: @company.website,
                phone: @company.phone,
                address: @company.address,
                state: @company.state,
                city: @company.city,
                status: @company.status,
                featured: @company.featured,
                verified: @company.verified
              }
              render json: { company: company_json }, status: :created
            else
              Rails.logger.warn "[Audit] Company creation failed: #{@company.errors.full_messages.join(', ')}"
              render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
            end
          end
        rescue ActiveRecord::RecordInvalid => e
          Rails.logger.error "[Audit] RecordInvalid during company creation: #{e.message}"
          render json: { errors: [e.message] }, status: :unprocessable_entity
        rescue StandardError => e
          Rails.logger.error "[Audit] Critical error creating company: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
          render json: { error: 'Internal Server Error' }, status: :internal_server_error
        end
      end

      # PATCH/PUT /api/v1/companies/:id
      def update
        Rails.logger.info "[Audit] Updating company ID #{@company.id}. User: #{current_user&.id}"

        if params[:company][:logo].present?
          Rails.logger.info "[Audit] Photo Flow: New logo upload detected for Company ID #{@company.id}"
        end

        was_ready = @company.ready_for_activation?
        
        if @company.update(company_params)
          # Track profile completion
          if !was_ready && @company.ready_for_activation? && current_user
            PostHog.capture(
              distinct_id: current_user.posthog_distinct_id,
              event: 'company_profile_completed',
              properties: {
                company_id: @company.id,
                company_name: @company.name,
                plan_tier: @company.respond_to?(:inferred_plan_tier) ? @company.inferred_plan_tier : 'free'
              }
            )
          end

          if @company.logo.attached? && params[:company][:logo].present?
            Rails.logger.info "[Audit] Photo Flow: Company logo updated successfully for ID #{@company.id}"
          end

          company_json = {
            id: @company.id,
            slug: @company.slug,
            name: @company.name,
            description: @company.description,
            website: @company.website,
            phone: @company.phone,
            address: @company.address,
            state: @company.state,
            city: @company.city,
            status: @company.status,
            featured: @company.featured,
            verified: @company.verified
          }
          render json: { company: company_json }, status: :ok
        else
          Rails.logger.warn "[Audit] Company update failed for ID #{@company.id}: #{@company.errors.full_messages.join(', ')}"
          render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/companies/:id
      def destroy
        @company.destroy
        head :no_content
      end

      # GET /api/v1/companies/:id/analytics/historical
      def analytics_historical
        days = (params[:days] || 30).to_i
        render json: { data: generate_historical_data(@company, days) }
      end

      # GET /api/v1/companies/:id/analytics/reviews
      def analytics_reviews
        render json: reviews_data
      end

      # GET /api/v1/companies/:id/analytics/competitors
      def analytics_competitors
        render json: competitors_data
      end

      # GET /api/v1/companies/:id/analytics/traffic
      def analytics_traffic
        render json: traffic_data
      end

      # GET /api/v1/companies/states
      def states
        states = Locations::BrLocations.states.map { |state| state['acronym'] }
        render json: { states: states }
      end

      # GET /api/v1/companies/cities
      def cities
        state = params[:state].to_s.strip.upcase
        cities = state.present? ? Locations::BrLocations.cities_for(state) : []
        render json: { cities: cities }
      end

      # GET /api/v1/companies/locations
      def locations
        locations = ::Company.distinct.pluck(:state, :city).compact
                             .map { |state, city| { state: state, city: city } }
                             .sort_by { |loc| [loc[:state], loc[:city]] }
        render json: { locations: locations }
      end

      private

      def fetch_companies_data
        retries = 0
        begin
        @companies = ::Company.includes(
          :categories,
          :badges,
          :company_faqs,
          :company_buttons,
          :plan,
          :company_financing_profile,
          review_aggregates: [:category],
          company_financing_partners: { logo_attachment: :blob },
          company_financing_offers: []
        )

          # Ordenação (Classificação)
          if params[:sort].present?
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
            ]
            if valid_sorts.include?(params[:sort])
              case params[:sort]
              when 'rating', 'rating_avg', 'rating_desc'
                @companies = @companies.reorder(rating_avg: :desc, rating_count: :desc)
              when 'reviews_desc'
                @companies = @companies.reorder(rating_count: :desc, rating_avg: :desc)
              when 'name', 'name_asc'
                @companies = @companies.reorder(name: :asc)
              when 'name_desc'
                @companies = @companies.reorder(name: :desc)
              when 'created_at', 'newest'
                @companies = @companies.reorder(created_at: :desc)
              when 'recommended'
                @companies = @companies.reorder(featured: :desc, rating_avg: :desc, rating_count: :desc,
                                                created_at: :desc)
              end
            else
              Rails.logger.warn "[Classification] Invalid sort parameter: #{params[:sort]}"
              # Se o parâmetro for inválido, usamos o padrão (melhores primeiro)
              @companies = @companies.reorder(rating_avg: :desc, rating_count: :desc, created_at: :desc)
            end
          else
            # Padrão: Melhores avaliadas primeiro (Ranking)
            @companies = @companies.order(rating_avg: :desc, rating_count: :desc, created_at: :desc)
          end

          # Filtra por empresas do usuário autenticado
          if ActiveModel::Type::Boolean.new.cast(params[:mine])
            return if authenticate_api_user == false

            @companies = @companies.joins(:company_members).where(company_members: { user_id: current_user.id })
          end

          # Filtros
          @companies = if params[:status].present?
                         @companies.where(status: params[:status])
                       else
                         # Default: listar apenas empresas ativas
                         @companies.where(status: ::Company.statuses[:active])
                       end

          if params[:q].present?
            term = params[:q].to_s.strip
            if term.present?
              @companies = @companies.search_by_text(term)
            end
          end

          if params[:featured].present?
            featured_value = ActiveModel::Type::Boolean.new.cast(params[:featured])
            @companies = @companies.where(featured: featured_value)
          end

          if params[:verified].present?
            verified_value = ActiveModel::Type::Boolean.new.cast(params[:verified])
            @companies = @companies.where(verified: verified_value)
          end

          if params[:state].present?
            states = Array(params[:state]).flat_map do |v|
              v.to_s.split(',')
            end.map { |s| s.strip.upcase }.reject(&:blank?)
            @companies = @companies.where(state: states) if states.any?
          end

          if params[:city].present?
            cities = Array(params[:city]).flat_map { |v| v.to_s.split(',') }.map(&:strip).reject(&:blank?)
            @companies = @companies.where(city: cities) if cities.any?
          end

          @companies = @companies.where('rating_avg >= ?', params[:min_rating].to_f) if params[:min_rating].present?

          if params[:category_id].present?
            @companies = @companies.joins(:categories).where(categories: { id: params[:category_id] })
          end

          if params[:category_ids].present?
            category_ids = Array(params[:category_ids]).flat_map do |v|
              v.to_s.split(',')
            end.map(&:to_i).select(&:positive?)
            @companies = @companies.joins(:categories).where(categories: { id: category_ids }) if category_ids.any?
          end

          # Apply manual limit only if not using pagination
          @companies = @companies.limit(params[:limit].to_i) if params[:limit].present? && !params[:page].present?

          # Apply pagination if page parameter is present
          if params[:page].present?
            paginated = paginate(@companies)
            set_pagination_headers(paginated)
            expires_in 5.minutes, public: true, stale_while_revalidate: 1.day

            companies_json = paginated.map do |company|
              company_json_attributes(company)
            end

            {
              data: companies_json,
              meta: { pagination: pagination_metadata(paginated) }
            }
          else
            expires_in 5.minutes, public: true, stale_while_revalidate: 1.day
            companies_json = @companies.map do |company|
              company_json_attributes(company)
            end

            companies_json
          end
        rescue ActiveRecord::StatementInvalid, ActiveRecord::ConnectionNotEstablished => e
          if (retries += 1) <= 3
            Rails.logger.warn("Transient database error in CompaniesController#index, retrying (#{retries}/3): #{e.message}")
            sleep(0.1 * retries)
            retry
          end
          raise e
        end
      end

      def generate_cache_key(params)
        filters = {
          status: params[:status],
          featured: params[:featured],
          verified: params[:verified],
          state: params[:state],
          city: params[:city],
          category_id: params[:category_id],
          category_ids: params[:category_ids],
          min_rating: params[:min_rating],
          q: params[:q],
          sort: params[:sort],
          limit: params[:limit],
          page: params[:page],
          mine: params[:mine]
        }.compact

        filter_hash = Digest::MD5.hexdigest(filters.sort.to_h.to_json)
        "companies:index:v2:#{filter_hash}"
      end

      def cache_ttl_for_params(params)
        # Shorter TTL for user-specific queries
        return 5.minutes if params[:mine] || params[:q].present?
        
        # Longer TTL for static lists
        return 1.hour if params[:featured] || params[:verified]
        
        # Default TTL
        15.minutes
      end

      def fetch_mine_companies_data(scope)
        scope.map do |company|
          {
            id: company.id,
            name: company.name,
            slug: company.slug,
            city: company.city,
            state: company.state,
            logo_url: company.logo_url,
            category: company.categories.first&.name,
            status: company.status,
            verified: company.verified
          }
        end
      end

      # Serializer used by index/featured endpoints
      def company_json_attributes(company)
        if params[:fields].to_s == 'card'
          # Use preloaded association to avoid N+1
          categories_array = company.categories.to_a
          primary_category = categories_array.first
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
            logo_url: company.logo_url,
            banner_url: company.banner_url,
            primary_category: primary_category&.name,
            category_ids: categories_array.take(5).map(&:id),
            feature_access: company.respond_to?(:feature_access) ? company.feature_access : {}
          }
        else
          company_detail_payload(company)
        end
      end

      def company_detail_payload(company)
        serialized_company = CompanySerializer.new(company).as_json
        serialized_company.merge(
          status: company.status,
          featured: company.featured,
          verified: company.verified,
          certifications: company.certifications,
          working_hours: company.working_hours,
          payment_methods: company.payment_methods,
          buttons: Rails.cache.fetch("company_buttons/#{company.id}/#{company.updated_at.to_i}",
                                     expires_in: 5.minutes) do
            company.company_buttons.active.ordered.select(:label, :url,
                                                          :button_type).as_json(only: %i[label url button_type])
          end,
          ctas: [],
          cta_whatsapp_enabled: company.respond_to?(:cta_whatsapp_enabled) ? company.cta_whatsapp_enabled : nil,
          cta_whatsapp_url: company.respond_to?(:cta_whatsapp_url) ? company.cta_whatsapp_url : nil,
          whatsapp_button_style_json: company.respond_to?(:whatsapp_button_style_json) ? company.whatsapp_button_style_json : nil,
          plan_status: company.respond_to?(:plan_status) ? company.plan_status : nil,
          plan_id: company.respond_to?(:plan_id) ? company.plan_id : nil,
          has_paid_plan: company.respond_to?(:has_paid_plan?) ? company.has_paid_plan? : false,
          plan_features: company.respond_to?(:effective_plan_features) ? company.effective_plan_features : {},
          feature_access: company.respond_to?(:feature_access) ? company.feature_access : {},
          social_proof_enabled: company.respond_to?(:social_proof_enabled) ? company.social_proof_enabled : false,
          can_use_social_proof: company.can_use_social_proof?,
          project_types: company.project_types || [],
          services_offered: company.services_offered || [],
          services: company.services_offered || [],
          seo_metadata: {
            json_ld: {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": company.name,
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": company.rating_avg.to_f > 0 ? company.rating_avg.to_f : 5.0,
                "reviewCount": company.rating_count.to_i > 0 ? company.rating_count.to_i : 1,
                "bestRating": "5",
                "worstRating": "1"
              }
            }
          }
        )
      end

      def company_verified_badge_url(company)
        return nil unless company.respond_to?(:verified_badge_url)

        company.verified_badge_url
      rescue StandardError => e
        Rails.logger.error("Error serializing verified badge URL for company #{company.id}: #{e.message}")
        nil
      end

      def company_badges_payload(company)
        badges = if company.association(:badges).loaded?
                   company.badges.select(&:active?).sort_by { |badge| badge.position || Float::INFINITY }
                 else
                   company.badges.active.order(position: :asc)
                 end

        badges.filter_map do |badge|
          {
            id: badge.id,
            name: badge.name,
            year: badge.year,
            edition: badge.edition,
            public_slug: badge.public_slug,
            image_url: badge.image_url
          }
        rescue StandardError => e
          Rails.logger.error("Error serializing badge #{badge&.id} for company #{company.id}: #{e.message}")
          nil
        end
      end

      def company_params
        permitted = [
          :name, :description, :website, :phone, :address, :state, :city,
          :founded_year, :employees_count,
          :cnpj, :email_public, :instagram, :facebook, :linkedin,
          :working_hours, :payment_methods, :certifications,
          :cta_whatsapp_enabled, :cta_whatsapp_url,
          :logo,
          { whatsapp_button_style_json: %i[
              variant bg_color text_color border_color
              hover_bg_color icon_color rounded_px
            ],
            project_types: [], services_offered: [] }
        ]

        permitted += %i[featured status verified plan_id plan_status social_proof_enabled] if current_user&.admin?

        params.require(:company).permit(*permitted)
      end

      def set_company
        @company = find_company_by_id_or_slug(params[:id])
        render json: { error: 'Company not found' }, status: :not_found unless @company
      end

      def reviews_data
        # Use @company if already set by before_action
        company = @company || find_company_by_id_or_slug(params[:id])
        return { error: 'Company not found' } unless company

        # Use preloaded reviews if available, or just the association
        reviews = company.reviews.includes(:user)
        distribution = reviews.group(:rating).count
        {
          total_reviews: reviews.count,
          average_rating: company.rating_avg || 0,
          rating_distribution: {
            5 => distribution[5.0] || 0,
            4 => distribution[4.0] || 0,
            3 => distribution[3.0] || 0,
            2 => distribution[2.0] || 0,
            1 => distribution[1.0] || 0
          },
          recent_reviews: reviews.order(created_at: :desc).limit(10).map do |review|
            {
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              user_name: review.user&.name || 'Anônimo',
              created_at: review.created_at,
              verified: review.verified
            }
          end,
          sentiment_analysis: calculate_sentiment(reviews)
        }
      rescue ActiveRecord::RecordNotFound
        { error: 'Company not found' }
      end

      def competitors_data
        company = Company.find(params[:id])
        category_id = params[:category_id]
        competitors = Company
                      .joins(:categories)
                      .where(categories: { id: category_id })
                      .where.not(id: company.id)
                      .where(status: 'active')
                      .order(rating_avg: :desc)
                      .limit(10)
        total_companies = competitors.count
        company_position = competitors.index { |c| c.rating_avg <= company.rating_avg } || total_companies
        collection_for_peers = ([company] + competitors).uniq(&:id)
        max_reviews = collection_for_peers.map { |c| c.try(:reviews_count).to_i }.max.to_f
        max_reviews = 1.0 if max_reviews.zero?
        {
          competitors: competitors.map.with_index(1) do |competitor, index|
            {
              company_id: competitor.id,
              company_name: competitor.name,
              rating: competitor.rating_avg || 0,
              reviews_count: competitor.reviews_count || 0,
              market_position: index,
              category_share: calculate_market_share(competitor, category_id)
            }
          end,
          company_position: company_position + 1,
          total_competitors: total_companies,
          comparison_peers: collection_for_peers.map do |c|
            {
              company_id: c.id,
              company_name: c.name,
              execution: ((c.rating_avg || 0).to_f * 20).round(2),
              innovation: (((c.try(:reviews_count) || 0).to_f / max_reviews) * 100).round(2),
              presence: (c.try(:profile_views_count) || c.try(:reviews_count) || 0).to_i,
              current: c.id == company.id
            }
          end
        }
      rescue ActiveRecord::RecordNotFound
        { error: 'Company not found' }
      end

      def traffic_data
        days = params[:days]&.to_i || 30
        sources = generate_traffic_sources(@company, days)
        { sources: sources }
      end

      def calculate_sentiment(reviews)
        positive = reviews.where('rating >= ?', 4).count
        negative = reviews.where('rating <= ?', 2).count
        total = reviews.count
        {
          positive_percentage: total.positive? ? (positive.to_f / total * 100).round(2) : 0,
          negative_percentage: total.positive? ? (negative.to_f / total * 100).round(2) : 0
        }
      end

      def calculate_market_share(company, category_id)
        total_reviews = ::Company.joins(:categories).where(categories: { id: category_id }).sum(:reviews_count)
        company_reviews = company.reviews_count || 0
        total_reviews.positive? ? (company_reviews.to_f / total_reviews * 100).round(2) : 0
      end

      def generate_traffic_sources(company, days)
        from_time = days.to_i.days.ago.beginning_of_day
        to_time = Time.current.end_of_day

        events = AnalyticsEvent.where(company_id: company.id, tracked_at: from_time..to_time,
                                      event_type: 'profile_view')
        lead_events = AnalyticsEvent.where(company_id: company.id, tracked_at: from_time..to_time,
                                           event_type: 'lead_created')

        visit_counts = Hash.new(0)
        lead_counts = Hash.new(0)

        events.find_each do |e|
          source = normalize_source(e.metadata)
          visit_counts[source] += 1
        end

        lead_events.find_each do |e|
          source = normalize_source(e.metadata)
          lead_counts[source] += 1
        end

        total = visit_counts.values.sum
        return [] if total.zero?

        visit_counts.map do |source, visits|
          leads = lead_counts[source].to_i
          {
            source: source,
            visits: visits,
            percentage: ((visits.to_f / total) * 100).round(2),
            conversion_rate: visits.positive? ? ((leads.to_f / visits) * 100).round(2) : 0
          }
        end.sort_by { |row| -row[:visits].to_i }
      end

      def generate_historical_data(company, days)
        days = days.to_i
        from_day = days.days.ago.to_date
        to_day = Date.current

        by_day = CompanyDailyStat
                 .for_company(company.id)
                 .for_days(from_day, to_day)
                 .order(:day)
                 .index_by(&:day)

        (from_day..to_day).map do |day|
          stat = by_day[day]
          views = stat&.profile_views.to_i
          clicks = stat&.cta_clicks.to_i + stat&.whatsapp_clicks.to_i

          {
            date: day.to_s,
            views: views,
            clicks: clicks
          }
        end
      end

      def normalize_source(metadata)
        meta = metadata.is_a?(Hash) ? metadata : {}
        utm = meta['utm_source'].to_s.strip
        return utm if utm.present?

        ref = meta['referrer'].to_s
        return 'Direct' if ref.blank?

        host = begin
          URI.parse(ref).host.to_s.downcase
        rescue StandardError
          ''
        end
        return 'Organic Search' if host.include?('google') || host.include?('bing') || host.include?('duckduckgo')
        if host.include?('facebook') || host.include?('instagram') || host.include?('linkedin') || host.include?('t.co') || host.include?('x.com')
          return 'Social Media'
        end

        'Referral'
      end

      def social_proof_review_payload(review)
        {
          id: review.id,
          rating: review.rating.to_f,
          comment: review.comment.to_s,
          featured: review.featured,
          display_order: review.display_order,
          status: review.status,
          created_at: review.created_at,
          reply: review.reply,
          replied_at: review.replied_at,
          user: {
            name: review.public_reviewer_name
          }
        }
      end

      def empty_social_proof_payload(company, limit:)
        {
          company_id: company.id,
          company_slug: company.slug,
          total_featured_reviews: 0,
          generated_at: Time.current.iso8601,
          limit: limit,
          reviews: []
        }
      end

      def authorize_company_update!
        return if performed?
        return if current_user&.admin?

        if company_user_authorized_for_target_company?
          return if company_active?(@company)

          render_error_response(
            message: 'Company account is not active',
            status: :forbidden,
            code: 'COMPANY_INACTIVE'
          )
          return
        end

        render_error_response(
          message: 'Not authorized to manage this company',
          status: :forbidden,
          code: 'FORBIDDEN'
        )
      end

      def authorize_company_scope!
        return if performed?
        return if current_user&.role.in?(%w[admin review])

        if company_user_authorized_for_target_company?
          unless company_active?(@company)
            render json: { error: 'Company account is not active' }, status: :forbidden
            return
          end
          return
        end

        Rails.logger.warn(
          "[AccessDenied] analytics user=#{current_user&.id} role=#{current_user&.role} " \
          "company_id=#{current_user&.company_id} target_company=#{@company&.id} " \
          "has_membership=#{current_user&.active_membership_for?(@company&.id)} path=#{request.path}"
        )
        render json: { error: 'Forbidden' }, status: :forbidden
      end

      def company_user_authorized_for_target_company?
        return false unless current_user&.company_user?
        return false unless @company&.id

        current_user.company_id == @company.id || current_user.active_membership_for?(@company.id)
      end

      def company_active?(company)
        return false unless company
        return company.active_status? if company.respond_to?(:active_status?)

        company.status.to_s == 'active'
      end

      def find_company_by_id_or_slug(raw_id)
        return nil if raw_id.blank?

        Rails.logger.info "[CompaniesController] Searching for company with raw_id: #{raw_id}"

        candidate_id = raw_id.to_s[/\A\d+/]
        if candidate_id.present?
          company = ::Company.includes(:badges).find_by(id: candidate_id)
          Rails.logger.info "[CompaniesController] Found by ID (#{candidate_id}): #{company&.name}" if company
        end

        if company.nil? && ::Company.column_names.include?('slug')
          company = ::Company.includes(:badges).find_by(slug: raw_id)
          Rails.logger.info "[CompaniesController] Found by slug (#{raw_id}): #{company&.name}" if company
        end

        if company.nil?
          # Try lowercase just in case
          company = ::Company.includes(:badges).find_by(slug: raw_id.to_s.downcase)
          Rails.logger.info "[CompaniesController] Found by lowercase slug: #{company&.name}" if company
        end

        Rails.logger.warn "[CompaniesController] Company NOT FOUND for: #{raw_id}" if company.nil?

        company
      end
    end
  end
end
