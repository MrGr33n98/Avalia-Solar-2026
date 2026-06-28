class StitchIdentityJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 10.seconds, attempts: 3

  def perform(user_id, anonymous_id)
    Rails.logger.info("[StitchIdentityJob] Stitching user=#{user_id} anon=#{anonymous_id}")

    user = User.find(user_id)
    session = AnonymousSession.find_by(anonymous_id: anonymous_id)

    unless session
      Rails.logger.warn("[StitchIdentityJob] Session not found: #{anonymous_id}")
      return
    end

    ActiveRecord::Base.transaction do
      # 1. Update anonymous session
      session.identify!(user)

      # 2. Migrate analytics events
      AnalyticsEvent.where(anonymous_id: anonymous_id, user_id: nil)
                    .update_all(user_id: user.id, updated_at: Time.current)

      # 2.1. Migrate dedicated buyer intent activities
      if defined?(BuyerIntentActivity)
        BuyerIntentActivity.where(anonymous_id: anonymous_id, user_id: nil)
                           .update_all(user_id: user.id, updated_at: Time.current)
      end

      # 3. Migrate intent scores
      IntentScore.where(anonymous_id: anonymous_id, lead_id: nil).find_each do |score|
        # Check if user already has a score for this company
        existing = IntentScore.find_by(company_id: score.company_id, lead_id: user.id)

        if existing
          merged_top_signals = (Array(existing.top_signals) + Array(score.top_signals)).uniq.first(10)

          existing.update!(
            total_score: [existing.total_score, score.total_score].max,
            micro_interaction_score: [existing.micro_interaction_score, score.micro_interaction_score].max,
            research_intent_score: [existing.research_intent_score, score.research_intent_score].max,
            financial_intent_score: [existing.financial_intent_score, score.financial_intent_score].max,
            contact_intent_score: [existing.contact_intent_score, score.contact_intent_score].max,
            total_signals_count: existing.total_signals_count + score.total_signals_count,
            hot_signals_count: existing.hot_signals_count + score.hot_signals_count,
            unique_sessions_count: existing.unique_sessions_count + score.unique_sessions_count,
            unique_pages_count: [existing.unique_pages_count, score.unique_pages_count].max,
            first_interaction_at: [existing.first_interaction_at, score.first_interaction_at].compact.min,
            last_interaction_at: [existing.last_interaction_at, score.last_interaction_at].compact.max,
            last_hot_signal_at: [existing.last_hot_signal_at, score.last_hot_signal_at].compact.max,
            days_active: [existing.days_active, score.days_active].max,
            confidence_score: [existing.confidence_score, score.confidence_score].max,
            decay_factor: [existing.decay_factor, score.decay_factor].max,
            score_breakdown: existing.score_breakdown.presence || score.score_breakdown,
            top_signals: merged_top_signals
          )
          score.destroy
        else
          # Transfer ownership
          score.update!(lead_id: user.id, anonymous_id: nil)
        end
      end

      # 4. Recalculate scores for all companies this user visited
      session.visited_company_ids.each do |company_id|
        CalculateBuyerIntentJob.perform_later(company_id, lead_id: user.id)
      end
    end

    Rails.logger.info("[StitchIdentityJob] ✓ Stitched #{user_id}")
  end
end
