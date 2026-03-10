class CalculateBuyerIntentJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 5.seconds, attempts: 3

  def perform(company_id, lead_id: nil, anonymous_id: nil)
    Rails.logger.info("[CalculateBuyerIntentJob] company=#{company_id} lead=#{lead_id} anon=#{anonymous_id}")
    
    score = IntentScoringService.new(
      company_id,
      lead_id: lead_id,
      anonymous_id: anonymous_id
    ).calculate!
    
    # Trigger notification if level changed to actionable
    if score.saved_change_to_intent_level? && score.actionable?
      NotifyIntentChangeJob.perform_later(score.id)
    end
    
    Rails.logger.info("[CalculateBuyerIntentJob] ✓ score=#{score.total_score} level=#{score.intent_level}")
    
    score
  end
end
