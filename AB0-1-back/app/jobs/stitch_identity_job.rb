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
      
      # 3. Migrate intent scores
      IntentScore.where(anonymous_id: anonymous_id, lead_id: nil).find_each do |score|
        # Check if user already has a score for this company
        existing = IntentScore.find_by(company_id: score.company_id, lead_id: user.id)
        
        if existing
          # Merge scores (take the higher one)
          if score.total_score > existing.total_score
            existing.update!(
              total_score: score.total_score,
              score_breakdown: score.score_breakdown,
              top_signals: score.top_signals
            )
          end
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
