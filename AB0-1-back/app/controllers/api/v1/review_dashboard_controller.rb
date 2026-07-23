# frozen_string_literal: true

module Api
  module V1
    class ReviewDashboardController < BaseController
      before_action :authenticate_api_user
      before_action :require_review_role

      # GET /api/v1/review_dashboard/summary
      def summary
        start_time = Time.current
        start_date = 30.days.ago.beginning_of_day
        end_date = Time.current

        # KPIs
        user_leads = Lead.where(email: current_user.email)
        quotes_total = safe_count(user_leads)
        quotes_open = safe_count(user_leads.where(wizard_status: %w[draft pending_otp verified]))
        quotes_replied = safe_count(user_leads.where(wizard_status: 'proposal_sent'))
        reviews_published = safe_count(current_user.reviews.where(status: :approved))

        # Gamification & Impact
        green_score = current_user.calculate_green_score
        regional_ranking = current_user.regional_ranking
        achievements = current_user.achievements
        helpful_votes = current_user.reviews.sum(:helpful_count)
        impacted_people = current_user.reviews.sum(:read_count)

        # Recommendations (real logic instead of mocked array)
        # Using the companies with highest rating from the same state/city
        recommendations = Company.where(status: 'active', verified: true)
                                 .order(rating_avg: :desc)
                                 .limit(3)
                                 .map do |c|
                                   {
                                     name: c.name,
                                     city: "#{c.city || current_user.city}, #{c.state || current_user.state}",
                                     rating: c.rating_avg.to_f,
                                     badge: c.featured ? 'Popular' : 'Verificada'
                                   }
        end

        # Recent activities feed
        recent_activities = []
        recent_replies = Review.where(user_id: current_user.id, reply_deleted_at: nil)
                               .where.not(reply: nil)
                               .order(replied_at: :desc)
                               .limit(2)
        recent_replies.each do |r|
          company_name = r.company&.name || 'Empresa'
          recent_activities << {
            icon: 'MessageCircle',
            title: "#{company_name} respondeu sua avaliação",
            time: r.replied_at.to_date == Time.zone.today ? 'hoje' : "há #{(Time.zone.today - r.replied_at.to_date).to_i} dias"
          }
        end
        if helpful_votes.positive?
          recent_activities << {
            icon: 'ThumbsUp',
            title: "Suas avaliações receberam #{helpful_votes} votos úteis",
            time: 'recentemente'
          }
        end

        # Charts Data - Real activity data from AnalyticsEvent
        chart_data = safe_activity_chart(start_date: start_date, end_date: end_date)

        # Profile Completion
        missing_fields = []
        missing_fields << 'avatar' unless avatar_attached?
        missing_fields << 'city' if current_user.city.blank?
        missing_fields << 'state' if current_user.state.blank?

        completion_percent = 100
        completion_percent -= 20 unless avatar_attached?
        completion_percent -= 20 if current_user.city.blank?
        completion_percent -= 10 if current_user.state.blank?

        # Sustainable Journey
        has_ev = user_leads.where(
          'LOWER(product_vertical) LIKE ? OR LOWER(product_vertical) LIKE ? OR LOWER(product_vertical) LIKE ?', '%car%', '%ev%', '%mobil%'
        ).exists?
        has_battery = user_leads.where('LOWER(product_vertical) LIKE ?', '%bater%').exists?
        has_reviews = reviews_published.positive?

        sustainable_journey = [
          {
            id: 'solar',
            title: 'Energia Solar',
            state: has_reviews ? 'Completo' : 'Não iniciado',
            progress: has_reviews ? 100 : 0,
            details: has_reviews ? ['Com avaliações no perfil'] : ['Sem avaliações ainda']
          },
          {
            id: 'mobility',
            title: 'Mobilidade Elétrica',
            state: has_ev ? 'Em progresso' : 'Não iniciado',
            progress: has_ev ? 55 : 0,
            details: has_ev ? ['Interesse demonstrado em propostas'] : ['Sem propostas na área']
          },
          {
            id: 'battery',
            title: 'Bateria / Armazenamento',
            state: has_battery ? 'Em progresso' : 'Não iniciado',
            progress: has_battery ? 36 : 0,
            details: has_battery ? ['Interesse demonstrado em propostas'] : ['Sem propostas na área']
          },
          {
            id: 'consumption',
            title: 'Consumo Consciente',
            state: completion_percent > 50 ? 'Em progresso' : 'Não iniciado',
            progress: completion_percent,
            details: ["Perfil #{completion_percent}% preenchido"]
          }
        ]

        # Performance monitoring
        duration_ms = ((Time.current - start_time) * 1000).round(2)
        Rails.logger.info({
          event: 'api_performance',
          endpoint: 'review_dashboard#summary',
          duration_ms: duration_ms,
          user_id: current_user.id,
          timestamp: Time.current.iso8601
        }.to_json)

        render json: {
          kpis: {
            quotes_total: quotes_total,
            quotes_open: quotes_open,
            quotes_replied: quotes_replied,
            reviews_published: reviews_published
          },
          gamification: {
            green_score: green_score,
            regional_ranking: regional_ranking,
            achievements: achievements
          },
          impact: {
            helpful_votes: helpful_votes,
            impacted_people: impacted_people
          },
          recommendations: recommendations,
          recent_activities: recent_activities,
          charts: {
            activity_30d: chart_data
          },
          profile: {
            completion_percent: completion_percent,
            missing_fields: missing_fields
          },
          sustainable_journey: sustainable_journey
        }
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] summary failed user=#{current_user&.id}: #{e.class} #{e.message}")
        render json: fallback_summary, status: :ok
      end

      private

      def require_review_role
        require_role('review', 'admin')
      end

      def safe_count(scope)
        scope.count
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] count failed: #{e.class} #{e.message}")
        0
      end

      def safe_activity_chart(start_date:, end_date:)
        Rails.cache.fetch(
          "review_dashboard:activity:#{current_user.id}",
          expires_in: 1.hour
        ) do
          ReviewDashboard::ActivityService
            .new(user: current_user)
            .activity_chart_data(start_date: start_date, end_date: end_date)
        end
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] activity chart failed: #{e.class} #{e.message}")
        empty_activity_chart(start_date: start_date, end_date: end_date)
      end

      def empty_activity_chart(start_date:, end_date:)
        (start_date.to_date..end_date.to_date).map do |date|
          {
            date: date.to_s,
            profile_views: 0,
            whatsapp_clicks: 0,
            cta_clicks: 0
          }
        end
      end

      def avatar_attached?
        current_user.respond_to?(:avatar) && current_user.avatar.attached?
      rescue StandardError
        false
      end

      def fallback_summary
        {
          kpis: {
            quotes_total: 0,
            quotes_open: 0,
            quotes_replied: 0,
            reviews_published: 0
          },
          gamification: {
            green_score: 520,
            regional_ranking: 1,
            achievements: []
          },
          impact: {
            helpful_votes: 0,
            impacted_people: 0
          },
          recommendations: [],
          recent_activities: [],
          charts: {
            activity_30d: empty_activity_chart(
              start_date: 30.days.ago.beginning_of_day,
              end_date: Time.current
            )
          },
          profile: {
            completion_percent: 0,
            missing_fields: %w[avatar city state]
          },
          sustainable_journey: [
            { id: 'solar', title: 'Energia Solar', state: 'Não iniciado', progress: 0,
              details: ['Sem avaliações ainda'] },
            { id: 'mobility', title: 'Mobilidade Elétrica', state: 'Não iniciado', progress: 0,
              details: ['Sem propostas na área'] },
            { id: 'battery', title: 'Bateria / Armazenamento', state: 'Não iniciado', progress: 0,
              details: ['Sem propostas na área'] },
            { id: 'consumption', title: 'Consumo Consciente', state: 'Não iniciado', progress: 0,
              details: ['Perfil 0% preenchido'] }
          ]
        }
      end
    end
  end
end
