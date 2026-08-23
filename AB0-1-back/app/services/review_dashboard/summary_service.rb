# frozen_string_literal: true

module ReviewDashboard
  class SummaryService
    ACTIVE_SECTIONS = %i[kpis gamification impact recommendations recent_activities charts profile].freeze
    UNAVAILABLE_SECTIONS = %i[sustainable_journey].freeze

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
      chart_data = measure('activity_chart') { activity_chart(start_date:, end_date: now) }
      sections = {
        kpis: measure('kpis') { kpis },
        gamification: measure('gamification') { gamification },
        impact: measure('impact') { impact },
        recommendations: measure('recommendations') { recommendations },
        recent_activities: measure('recent_activities') { recent_activities },
        charts: chart_data.nil? ? nil : { activity_30d: chart_data },
        profile: measure('profile') { profile },
        sustainable_journey: nil
      }
      stale_sections = (ACTIVE_SECTIONS + UNAVAILABLE_SECTIONS).filter_map do |name|
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
      {
        quotes_total: counts.values.sum,
        quotes_open: counts.values_at('draft', 'pending_otp', 'verified').compact.sum,
        quotes_replied: counts.fetch('proposal_sent', 0),
        reviews_published: approved_reviews.count
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
      approved_reviews.where.not(reply: nil).where(reply_deleted_at: nil)
                     .includes(:company).order(replied_at: :desc).limit(2).filter_map do |review|
        next if review.replied_at.blank?

        {
          icon: 'MessageCircle',
          title: "#{review.company&.name || 'Empresa'} respondeu sua avaliação",
          time: relative_day(review.replied_at)
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