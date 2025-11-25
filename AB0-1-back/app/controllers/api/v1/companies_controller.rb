# app/controllers/api/v1/companies_controller.rb
module Api
  module V1
    class CompaniesController < BaseController
      include Paginatable # TASK-017: Enable pagination
      
      before_action :set_company, only: %i[show update destroy analytics_historical analytics_reviews analytics_competitors analytics_traffic categories]
      before_action :authenticate_api_user, only: %i[analytics_historical analytics_reviews analytics_competitors analytics_traffic]
      before_action :authorize_company_scope!, only: %i[analytics_historical analytics_reviews analytics_competitors analytics_traffic]

      # GET /api/v1/companies
      def index
        Rails.logger.info("Starting companies#index with params: #{params.inspect}")

        @companies = Company.includes(:categories, :reviews)
                            .order(created_at: :desc)

        # Filtros
        if params[:status].present?
          @companies = @companies.where(status: params[:status])
        else
          # Default: listar apenas empresas ativas
          @companies = @companies.where(status: Company.statuses[:active])
        end
        if params[:featured].present?
          featured_value = ActiveModel::Type::Boolean.new.cast(params[:featured])
          @companies = @companies.where(featured: featured_value)
        end
        if params[:category_id].present?
          @companies = @companies.joins(:categories).where(categories: { id: params[:category_id] })
        end
        
        # Apply manual limit only if not using pagination
        if params[:limit].present? && !params[:page].present?
          @companies = @companies.limit(params[:limit].to_i)
        end

        # Apply pagination if page parameter is present
        if params[:page].present?
          paginated = paginate(@companies)
          set_pagination_headers(paginated)
          
          companies_json = paginated.map do |company|
            company_json_attributes(company)
          end

          render json: { 
            data: companies_json,
            meta: { pagination: pagination_metadata(paginated) }
          }, status: :ok
        else
          companies_json = @companies.map do |company|
            company_json_attributes(company)
          end

          render json: companies_json, status: :ok
        end
      end

      # GET /api/v1/companies/:id
      def show
        return render json: { error: 'Company not found' }, status: :not_found unless @company
        company_json = {
          id: @company.id,
          name: @company.name,
          description: @company.description,
          website: @company.website,
          phone: @company.phone,
          address: @company.address,
          state: @company.state,
          city: @company.city,
          created_at: @company.created_at,
          updated_at: @company.updated_at,
          banner_url: @company.banner_url,
          logo_url: @company.logo_url,
          rating_avg: @company.rating_avg,
          rating_count: @company.rating_count,
          status: @company.status,
          featured: @company.featured,
          verified: @company.verified,
          founded_year: @company.founded_year,
          employees_count: @company.employees_count,
          certifications: @company.certifications,
          email_public: @company.email_public,
          instagram: @company.instagram,
          facebook: @company.facebook,
          linkedin: @company.linkedin,
          working_hours: @company.working_hours,
          payment_methods: @company.payment_methods,
          ctas: [],
          cta_whatsapp_enabled: @company.respond_to?(:cta_whatsapp_enabled) ? @company.cta_whatsapp_enabled : nil,
          cta_whatsapp_url: @company.respond_to?(:cta_whatsapp_url) ? @company.cta_whatsapp_url : nil,
          whatsapp_button_style_json: @company.respond_to?(:whatsapp_button_style_json) ? @company.whatsapp_button_style_json : nil,
          plan_status: @company.respond_to?(:plan_status) ? @company.plan_status : nil,
          plan_id: @company.respond_to?(:plan_id) ? @company.plan_id : nil,
          has_paid_plan: (@company.respond_to?(:plan_status) && @company.respond_to?(:plan)) ? @company.has_paid_plan? : false,
          project_types: @company.project_types || [],
          services_offered: @company.services_offered || []
        }
        render json: { company: company_json }, status: :ok
      end

      def categories
        cats = @company.categories.select(:id, :name, :seo_url, :status, :featured, :created_at, :updated_at)
        render json: { categories: cats.as_json }, status: :ok
      end

      # POST /api/v1/companies
      def create
        @company = Company.new(company_params)
        @company.status = 'pending' if @company.status.blank?
        if @company.save
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
          rescue => e
            Rails.logger.warn "Falha ao notificar administradores: #{e.message}"
          end

          company_json = {
            id: @company.id,
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
          render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/companies/:id
      def update
        if @company.update(company_params)
          company_json = {
            id: @company.id,
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
          render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/companies/:id
      def destroy
        @company.destroy
        head :no_content
      end

      # GET /api/v1/companies/states
      def states
        states = Company.distinct.pluck(:state).compact.sort
        render json: { states: states }
      end

      # GET /api/v1/companies/cities
      def cities
        cities = if params[:state].present?
                   Company.where(state: params[:state]).distinct.pluck(:city).compact.sort
                 else
                   Company.distinct.pluck(:city).compact.sort
                 end
        render json: { cities: cities }
      end

      # GET /api/v1/companies/locations
      def locations
        locations = Company.distinct.pluck(:state, :city).compact
                           .map { |state, city| { state: state, city: city } }
                           .sort_by { |loc| [loc[:state], loc[:city]] }
        render json: { locations: locations }
      end

      private

      def set_company
        @company = Company.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Company not found' }, status: :not_found and return
        nil
      end

      def company_json_attributes(company)
        {
          id: company.id,
          name: company.name,
          description: company.description,
          website: company.website,
          phone: company.phone,
          address: company.address,
          state: company.state,
          city: company.city,
          created_at: company.created_at,
          updated_at: company.updated_at,
          banner_url: company.banner_url,
          logo_url: company.logo_url,
          rating_avg: company.rating_avg,
          rating_count: company.rating_count,
          status: company.status,
          featured: company.featured,
          verified: company.verified,
          founded_year: company.founded_year,
          employees_count: company.employees_count,
          certifications: company.certifications,
          email_public: company.email_public,
          instagram: company.instagram,
          facebook: company.facebook,
          linkedin: company.linkedin,
          working_hours: company.working_hours,
          payment_methods: company.payment_methods,
          cta_whatsapp_enabled: company.respond_to?(:cta_whatsapp_enabled) ? company.cta_whatsapp_enabled : nil,
          cta_whatsapp_url: company.respond_to?(:cta_whatsapp_url) ? company.cta_whatsapp_url : nil,
          whatsapp_button_style_json: company.respond_to?(:whatsapp_button_style_json) ? company.whatsapp_button_style_json : nil,
          plan_status: company.respond_to?(:plan_status) ? company.plan_status : nil,
          plan_id: company.respond_to?(:plan_id) ? company.plan_id : nil,
          has_paid_plan: (company.respond_to?(:plan_status) && company.respond_to?(:plan)) ? company.has_paid_plan? : false
        }
      end

      def company_params
        params.require(:company).permit(
          :name, :description, :website, :phone, :address, :state, :city,
          :featured, :status, :verified, :founded_year, :employees_count,
          :cnpj, :email_public, :instagram, :facebook, :linkedin,
          :working_hours, :payment_methods, :certifications,
          :cta_whatsapp_enabled, :cta_whatsapp_url, :plan_id, :plan_status,
          whatsapp_button_style_json: [
            :variant, :bg_color, :text_color, :border_color,
            :hover_bg_color, :icon_color, :rounded_px
          ],
          project_types: [], services_offered: []
        )
      end

      def analytics_historical
        days = params[:days]&.to_i || 30
        begin
          if @company
            data = if @company.respond_to?(:historical_stats)
                     @company.historical_stats(days)
                   else
                     generate_historical_data(@company, days)
                   end
            render json: { data: data }, status: :ok
          else
            render json: { data: generate_historical_data(nil, days) }, status: :ok
          end
        rescue => e
          Rails.logger.error("analytics_historical error: #{e.message}")
          render json: { data: generate_historical_data(nil, days) }, status: :ok
        end
      end

      def analytics_reviews
        render json: reviews_data
      end

      def analytics_competitors
        render json: competitors_data
      end

      def analytics_traffic
        days = params[:days]&.to_i || 30
        begin
          sources = generate_traffic_sources(@company, days)
          render json: { sources: sources }, status: :ok
        rescue => e
          Rails.logger.error("analytics_traffic error: #{e.message}")
          render json: { sources: [] }, status: :ok
        end
      end

      def request_admin_access
        authenticate_api_user
        return unless @company

        change = PendingChange.create!(
          company: @company,
          user_id: current_user&.id,
          change_type: 'access_request',
          data: { requested_at: Time.current },
          status: 'pending'
        )

        render json: { message: 'Solicitação enviada para aprovação', pending_change: change }, status: :created
      end

      private

       def historical_data
         company = Company.find(params[:id])
         days = params[:days]&.to_i || 30
         data = generate_historical_data(company, days)
         { data: data }
       rescue ActiveRecord::RecordNotFound
         { error: 'Company not found' }
       end

       def reviews_data
         company = Company.find(params[:id])
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
           total_competitors: total_companies
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
           positive_percentage: total > 0 ? (positive.to_f / total * 100).round(2) : 0,
           negative_percentage: total > 0 ? (negative.to_f / total * 100).round(2) : 0
         }
       end

       def calculate_market_share(company, category_id)
         total_reviews = Company.joins(:categories).where(categories: { id: category_id }).sum(:reviews_count)
         company_reviews = company.reviews_count || 0
         total_reviews > 0 ? (company_reviews.to_f / total_reviews * 100).round(2) : 0
       end

      def generate_traffic_sources(company, days)
        [
          { source: 'Direct', visits: 250, percentage: 25, conversion_rate: 12.3 },
          { source: 'Referral', visits: 120, percentage: 12, conversion_rate: 6.8 },
          { source: 'Social Media', visits: 180, percentage: 18, conversion_rate: 5.2 },
          { source: 'Organic Search', visits: 450, percentage: 45, conversion_rate: 8.5 }
        ]
      end

      def generate_historical_data(company, days)
        (0...days).map do |day|
          date = (Date.today - day)
          {
            date: date.to_s,
            views: rand(50..200),
            clicks: rand(10..80),
            leads: company ? company.leads.where(created_at: date.beginning_of_day..date.end_of_day).count : rand(0..10),
            conversion: rand(0.0..15.0).round(2)
          }
        end.reverse
      end
    end
  end
end
      def authorize_company_scope!
        return if current_user&.role == 'admin'
        if current_user&.role == 'company' && current_user.company_id == @company&.id
          return
        end
        Rails.logger.warn("[AccessDenied] analytics user=#{current_user&.id} role=#{current_user&.role} company_id=#{current_user&.company_id} target_company=#{@company&.id} path=#{request.path}")
        render json: { error: 'Forbidden' }, status: :forbidden
      end
