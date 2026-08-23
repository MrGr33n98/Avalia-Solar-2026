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
        lead_counts = measure_summary_step('lead_kpis') { user_leads.group(:wizard_status).count }
        quotes_total = lead_counts.values.sum
        quotes_open = lead_counts.values_at('draft', 'pending_otp', 'verified').compact.sum
        quotes_replied = lead_counts.fetch('proposal_sent', 0)
        reviews_published = measure_summary_step('reviews_published') { safe_count(current_user.reviews.where(status: :approved)) }

        # Gamification & Impact
        green_score = measure_summary_step('green_score') { current_user.calculate_green_score }
        regional_ranking = measure_summary_step('regional_ranking') { current_user.regional_ranking(score: green_score) }
        achievements = measure_summary_step('achievements') { current_user.achievements }
        helpful_votes = measure_summary_step('impact_helpful_votes') do
          current_user.reviews.where(status: :approved).sum(:helpful_count)
        end
        impacted_people = measure_summary_step('impact_read_count') do
          current_user.reviews.where(status: :approved).sum(:read_count)
        end

        # Recommendations (real logic instead of mocked array)
        # Using the companies with highest rating from the same state/city
        recommendations = measure_summary_step('recommendations') { ::Company.where(status: 'active', verified: true)
                                 .select(:name, :city, :state, :rating_avg, :featured)
                                 .order(rating_avg: :desc)
                                 .limit(3)
                                 .map do |c|
                                   {
                                     name: c.name,
                                     city: "#{c.city || current_user.city}, #{c.state || current_user.state}",
                                     rating: c.rating_avg.to_f,
                                     badge: c.featured ? 'Popular' : 'Verificada'
                                   }
        end }

        # Recent activities feed
        recent_activities = measure_summary_step('recent_activities') do
          activities = []
        recent_replies = Review.where(user_id: current_user.id, reply_deleted_at: nil)
                               .where.not(reply: nil)
                               .includes(:company)
                               .order(replied_at: :desc)
                               .limit(2)
        recent_replies.each do |r|
          company_name = r.company&.name || 'Empresa'
          activities << {
            icon: 'MessageCircle',
            title: "#{company_name} respondeu sua avaliação",
            time: r.replied_at.to_date == Time.zone.today ? 'hoje' : "há #{(Time.zone.today - r.replied_at.to_date).to_i} dias"
          }
        end
        if helpful_votes.positive?
          activities << {
            icon: 'ThumbsUp',
            title: "Suas avaliações receberam #{helpful_votes} votos úteis",
            time: 'recentemente'
          }
        end
          activities
        end

        # Charts Data - Real activity data from AnalyticsEvent
        chart_data = measure_summary_step('activity_chart') { safe_activity_chart(start_date: start_date, end_date: end_date) }

        # Profile Completion — fonte única do domínio Reviewer
        profile_completion = measure_summary_step('profile_completion') { ::Reviewer::ProfileCompletionService.new(user: current_user).call }
        completion_percent = profile_completion[:percent]
        missing_fields = profile_completion[:missing_fields]

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
            achievements: achievements,
            earned_points: achievements.sum { |achievement| achievement[:xp].to_i },
            level: current_user.gamification_level
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
            missing_fields: missing_fields,
            items: profile_completion[:items]
          },
          sustainable_journey: sustainable_journey
        }
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] summary failed user=#{current_user&.id}: #{e.class} #{e.message}")
        render json: {
          error: {
            code: 'REVIEW_DASHBOARD_SUMMARY_UNAVAILABLE',
            message: 'Não foi possível carregar o resumo do dashboard.',
            request_id: request.request_id
          }
        }, status: :service_unavailable, headers: { 'X-Request-ID' => request.request_id }
      end

      private

      def measure_summary_step(step)
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        result = yield
        duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(2)
        Rails.logger.info({ event: 'review_dashboard_step', step: step, duration_ms: duration_ms, user_id: current_user.id }.to_json)
        result
      end

      def require_review_role
        require_role('review', 'admin')
      end

      def safe_count(scope)
        scope.count
      rescue StandardError => e
        Rails.logger.error("[ReviewDashboard] count failed: #{e.class} #{e.message}")
        nil
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
        nil
      end

    end
  end
end
