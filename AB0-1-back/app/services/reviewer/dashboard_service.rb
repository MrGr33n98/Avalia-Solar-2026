# frozen_string_literal: true

module Reviewer
  class DashboardService
    def initialize(user:)
      @user = user
    end

    def call
      reviews = @user.reviews.includes(:company).order(created_at: :desc)
      leads = Lead.where(email: @user.email)

      {
        summary: summary(reviews, leads),
        green_score: Reviewer::GreenScoreService.new(user: @user).call,
        achievements: Reviewer::AchievementService.new(user: @user).call,
        journeys: Reviewer::JourneyService.new(user: @user).call,
        recent_activity: ReviewDashboard::ActivityService.new(user: @user).recent_events,
        profile: profile,
        next_best_action: next_best_action(reviews)
      }
    end

    private

    def summary(reviews, leads)
      {
        reviews_total: reviews.size,
        reviews_published: reviews.count { |review| review.status == 'approved' },
        reviews_pending: reviews.count { |review| %w[pending in_analysis].include?(review.status) },
        proposals_total: leads.count,
        proposals_open: leads.where(wizard_status: %w[draft pending_otp verified]).count
      }
    end

    def recent_activity(reviews)
      reviews.filter_map do |review|
        next if review.reply.blank? || review.reply_deleted_at.present?

        {
          type: 'review_answered',
          title: "#{review.company&.name || 'Empresa'} respondeu sua avaliação",
          created_at: review.replied_at&.iso8601,
          review_id: review.id,
          company_id: review.company_id
        }
      end.first(10)
    end

    def profile
      missing_fields = []
      missing_fields << 'avatar' unless @user.respond_to?(:avatar) && @user.avatar.attached?
      missing_fields << 'city' if @user.city.blank?
      missing_fields << 'state' if @user.state.blank?

      { completion_percent: 100 - (missing_fields.size * 20), missing_fields: missing_fields }
    end

    def next_best_action(reviews)
      return { type: 'create_review', label: 'Avalie sua primeira empresa', href: '/reviews/my' } if reviews.empty?
      return { type: 'complete_profile', label: 'Complete seu perfil', href: '/review-dashboard/profile' } if @user.city.blank? || @user.state.blank?

      { type: 'view_reviews', label: 'Acompanhe suas avaliações', href: '/review-dashboard/reviews' }
    end
  end
end
