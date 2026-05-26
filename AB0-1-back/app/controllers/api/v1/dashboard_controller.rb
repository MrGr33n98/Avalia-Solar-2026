# app/controllers/api/v1/dashboard_controller.rb
module Api
  module V1
    class DashboardController < BaseController
      before_action :authenticate_api_user
      after_action :verify_authorized
      
      # GET /api/v1/dashboard/stats
      def stats
        authorize :dashboard, :stats?

        companies_count = Company.count
        products_count = Product.count
        leads_count = Lead.count
        reviews_count = Review.count
        active_campaigns = if defined?(Campaign)
                             Campaign.where('start_date <= ? AND end_date >= ?', Date.today,
                                            Date.today).count
                           else
                             0
                           end
        monthly_revenue = calculate_monthly_revenue

        # Calculate Growth Rate (Companies)
        this_month_new = Company.where(created_at: Time.now.beginning_of_month..Time.now).count
        last_month_new = Company.where(created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month).count
        growth_rate = if last_month_new > 0
                        ((this_month_new - last_month_new).to_f / last_month_new * 100).round(1)
                      else
                        this_month_new > 0 ? 100.0 : 0.0
                      end

        # Calculate Satisfaction Score (Based on Reviews)
        avg_rating = Review.average(:rating) || 0
        satisfaction_score = (avg_rating * 20).round(1) # scale 1-5 to 1-100

        render json: {
          companies_count: companies_count,
          products_count: products_count,
          leads_count: leads_count,
          reviews_count: reviews_count,
          active_campaigns: active_campaigns,
          monthly_revenue: monthly_revenue,
          growth_rate: growth_rate,
          satisfaction_score: satisfaction_score
        }
      rescue StandardError => e
        Rails.logger.error("Dashboard stats error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      # GET /api/v1/dashboard/charts/:metric
      # Params: metric (companies|revenue|leads), period (weekly|monthly|quarterly)
      def charts
        authorize :dashboard, :charts?

        metric = params[:metric] || 'companies'
        period = params[:period] || 'monthly'
        
        chart_data = case metric
                    when 'companies'
                      get_companies_chart_data(period)
                    when 'revenue'
                      get_revenue_chart_data(period)
                    when 'leads'
                      get_leads_chart_data(period)
                    else
                      []
                    end

        render json: chart_data
      rescue StandardError => e
        Rails.logger.error("Dashboard charts error: #{e.message}")
        render json: { error: 'Erro ao buscar dados do gráfico' }, status: :internal_server_error
      end

      # GET /api/v1/dashboard/activity
      # Recent activity feed
      def activity
        authorize :dashboard, :activity?

        limit = [params[:limit].to_i, 20].min
        limit = 10 if limit <= 0

        ActiveSupport::Notifications.instrument('dashboard.activity.fetch', limit: limit) do |payload|
          activities = []

          # Recent companies
          recent_companies = Company.order(created_at: :desc).limit(5).select(:id, :name, :created_at)
          recent_companies.each do |company|
            activities << {
              id: "company_#{company.id}",
              type: 'company',
              title: 'Nova empresa cadastrada',
              description: "#{company.name} foi adicionada ao sistema",
              time: time_ago_in_words(company.created_at),
              created_at: company.created_at
            }
          end

          # Recent leads
          recent_leads = Lead.order(created_at: :desc).limit(5).select(:id, :name, :email, :created_at)
          recent_leads.each do |lead|
            activities << {
              id: "lead_#{lead.id}",
              type: 'proposal',
              title: 'Nova proposta recebida',
              description: "Proposta de #{lead.name || lead.email}",
              time: time_ago_in_words(lead.created_at),
              created_at: lead.created_at
            }
          end

          # Recent reviews
          recent_reviews = Review.includes(:company).order(created_at: :desc).limit(5).select(:id, :company_id, :rating, :created_at)
          recent_reviews.each do |review|
            activities << {
              id: "review_#{review.id}",
              type: 'review',
              title: 'Nova avaliação',
              description: "#{review.company.name} recebeu #{review.rating} estrelas",
              time: time_ago_in_words(review.created_at),
              created_at: review.created_at
            }
          end

          # Sort by most recent and limit
          activities.sort_by! { |a| a[:created_at] }
          activities.reverse!
          activities = activities.take(limit)

          payload[:activities_count] = activities.size
          render json: activities
        end
      rescue StandardError => e
        Rails.logger.error("Dashboard activity error: #{e.message}")
        render json: { error: 'Erro ao buscar atividades recentes' }, status: :internal_server_error
      end

      private

      def calculate_monthly_revenue
        # 1. SaaS Revenue from Active Subscription Plans
        saas_revenue = SubscriptionPlan.where(status: 'active')
                                      .where('start_at <= ? AND (end_at IS NULL OR end_at >= ?)', Time.current, Time.current)
                                      .sum(:value)

        # 2. AdSales Revenue from Active Banner Subscriptions
        # Convert cents to main currency unit
        ads_revenue_cents = BannerSubscription.joins(:banner_offer)
                                               .where(status: 'active')
                                               .where('start_at <= ? AND (end_at IS NULL OR end_at >= ?)', Time.current, Time.current)
                                               .sum('banner_offers.price_cents')

        saas_revenue + (ads_revenue_cents / 100.0)
      end

      def get_companies_chart_data(period)
        months = case period
                when 'weekly'
                  6.downto(0).map { |i| i.weeks.ago.beginning_of_week }
                when 'quarterly'
                  6.downto(0).map { |i| i.months.ago.beginning_of_month }
                else # monthly
                  6.downto(0).map { |i| i.months.ago.beginning_of_month }
                end

        months.map do |start_date|
          end_date = case period
                    when 'weekly'
                      start_date.end_of_week
                    else
                      start_date.end_of_month
                    end

          count = Company.where(created_at: start_date..end_date).count
          
          {
            month: I18n.l(start_date, format: '%b'),
            value: count,
            label: I18n.l(start_date, format: '%B %Y')
          }
        end
      end

      def get_revenue_chart_data(period)
        # Period fixed at last 6 months for dashboard consistency
        months_to_fetch = 6
        end_date = Time.current.end_of_month
        start_date = (end_date - (months_to_fetch - 1).months).beginning_of_month

        # Fetch and group SaaS revenue
        saas_data = if ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
                      SubscriptionPlan.where(created_at: start_date..end_date)
                                     .group("DATE_TRUNC('month', created_at)")
                                     .sum(:value)
                    else
                      # SQLite fallback
                      SubscriptionPlan.where(created_at: start_date..end_date)
                                     .group("strftime('%Y-%m-01', created_at)")
                                     .sum(:value)
                    end

        # Fetch and group Ads revenue
        ads_data = if ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
                     BannerSubscription.joins(:banner_offer)
                                      .where(created_at: start_date..end_date)
                                      .group("DATE_TRUNC('month', banner_subscriptions.created_at)")
                                      .sum('banner_offers.price_cents')
                   else
                     # SQLite fallback
                     BannerSubscription.joins(:banner_offer)
                                      .where(created_at: start_date..end_date)
                                      .group("strftime('%Y-%m-01', banner_subscriptions.created_at)")
                                      .sum('banner_offers.price_cents')
                   end

        # Generate the last 6 months sequence
        (0..(months_to_fetch - 1)).map do |i|
          date = (start_date + i.months).beginning_of_month
          # Convert PG timestamp key to Time object for lookup if needed, 
          # but group by DATE_TRUNC usually returns Time objects in Rails
          saas_val = saas_data.find { |k, v| k.to_date.beginning_of_month == date.to_date }&.last || 0
          ads_val = (ads_data.find { |k, v| k.to_date.beginning_of_month == date.to_date }&.last || 0) / 100.0
          
          {
            month: I18n.l(date, format: '%b'),
            value: (saas_val + ads_val).to_f.round(2),
            label: I18n.l(date, format: '%B %Y')
          }
        end
      end

      def get_leads_chart_data(period)
        months = case period
                when 'weekly'
                  6.downto(0).map { |i| i.weeks.ago.beginning_of_week }
                when 'quarterly'
                  6.downto(0).map { |i| i.months.ago.beginning_of_month }
                else # monthly
                  6.downto(0).map { |i| i.months.ago.beginning_of_month }
                end

        months.map do |start_date|
          end_date = case period
                    when 'weekly'
                      start_date.end_of_week
                    else
                      start_date.end_of_month
                    end

          count = Lead.where(created_at: start_date..end_date).count
          
          {
            month: I18n.l(start_date, format: '%b'),
            value: count,
            label: I18n.l(start_date, format: '%B %Y')
          }
        end
      end

      def time_ago_in_words(time)
        seconds = Time.now - time
        
        case seconds
        when 0..59
          'agora mesmo'
        when 60..3599
          "há #{(seconds / 60).to_i} minutos"
        when 3600..86399
          "há #{(seconds / 3600).to_i} horas"
        when 86400..604799
          "há #{(seconds / 86400).to_i} dias"
        else
          "há #{(seconds / 604800).to_i} semanas"
        end
      end
    end
  end
end

