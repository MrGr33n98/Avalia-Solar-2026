# frozen_string_literal: true

module ReviewDashboard
  class SummaryService
    ACTIVE_SECTIONS = %i[kpis gamification impact recommendations recent_activities charts profile].freeze

    def initialize(user:, clock: -> { Time.current }, request_id: nil)
      @user = user
      @clock = clock
      @request_id = request_id
    end

    def call
      now = @clock.call
      start_date = now - 30.days
      start_date = start_date.beginning_of_day

      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      sections = {
        kpis: measure('kpis') { kpis },
        gamification: measure('gamification') { gamification },
        impact: measure('impact') { impact },
        recommendations: measure('recommendations') { recommendations },
        recent_activities: measure('recent_activities') { recent_activities },
        charts: measure('charts') do
          chart_data = activity_chart(start_date:, end_date: now)
          chart_data ? { activity_30d: chart_data } : nil
        end,
        profile: measure('profile') { profile },
      }
      stale_sections = ACTIVE_SECTIONS.filter_map do |name|
        name.to_s if sections[name].nil?
      end

      payload = {
        meta: {
          schema_version: 2,
          generated_at: now.iso8601,
          partial: stale_sections.any?,
          stale_sections: stale_sections,
          request_id: @request_id,
          duration_ms: ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(2)
        },
        **sections
      }
      payload
    end

    private

    def measure(step)
      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      result = yield
      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(2)
      Rails.logger.info({
        event: 'review_dashboard_step',
        step: step,
        duration_ms: duration_ms,
        user_id: @user.id
      }.to_json)
      result
    rescue StandardError => e
      Rails.logger.error({
        event: 'review_dashboard_step_failed',
        step: step,
        user_id: @user.id,
        error_class: e.class.name,
        message: e.message
      }.to_json)
      nil
    end

    def kpis
      user_leads = Lead.where(email: @user.email)
      counts = user_leads.group(:wizard_status).count
      reviews = @user.reviews.group(:status).count
      {
        quotes_total: counts.values.sum,
        quotes_open: counts.values_at('draft', 'pending_otp', 'verified').compact.sum,
        quotes_replied: counts.fetch('proposal_sent', 0),
        reviews: {
          total: reviews.values.sum,
          published: reviews.fetch("approved", 0),
          pending: reviews.values_at("pending", "in_analysis").compact.sum,
          rejected: reviews.fetch("rejected", 0)
        },
        # Compatibilidade com consumidores legados.
        reviews_published: reviews.fetch("approved", 0)
      }
    end

    def approved_reviews
      @user.reviews.where(status: :approved)
    end

    def gamification
      score = @user.calculate_green_score
      achievements = @user.achievements
      {
        green_score: score,
        regional_ranking: @user.regional_ranking(score: score),
        achievements: achievements,
        earned_points: achievements.sum { |achievement| achievement[:xp].to_i },
        level: score.nil? ? nil : @user.gamification_level
      }
    end

    def impact
      {
        helpful_votes: approved_reviews.sum(:helpful_count),
        impacted_people: approved_reviews.sum(:read_count)
      }
    end

    def recommendations
      Company.where(status: 'active', verified: true)
             .select(:name, :city, :state, :rating_avg, :featured)
             .order(rating_avg: :desc)
             .limit(3)
             .map do |company|
        {
          name: company.name,
          city: [company.city, company.state].compact.join(', '),
          rating: company.rating_avg,
          badge: company.featured ? 'Popular' : 'Verificada'
        }
      end
    end

    def recent_activities
      ReviewDashboard::ActivityService.new(user: @user).recent_events(limit: 10).map do |event|
        {
          id: event[:id] || event[:review_id] || event[:notification_id],
          type: event[:type],
          title: event[:title],
          subtitle: event[:company_id] ? 'Contribuição na comunidade' : nil,
          occurred_at: event[:created_at]&.iso8601,
          review_id: event[:review_id],
          company_id: event[:company_id]
        }
      end
    end

    def relative_day(timestamp)
      days = (Time.zone.today - timestamp.to_date).to_i
      days.zero? ? 'hoje' : "há #{days} dias"
    end

    def activity_chart(start_date:, end_date:)
      ReviewDashboard::ActivityService.new(user: @user).activity_chart_data(start_date:, end_date:)
    end

    def profile
      completion = Reviewer::ProfileCompletionService.new(user: @user).call
      {
        completion_percent: completion[:percent],
        missing_fields: completion[:missing_fields],
        items: completion[:items]
      }
    end
  end
end
