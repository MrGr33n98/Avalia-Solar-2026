class NotifyIntentChangeJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 30.seconds, attempts: 2

  def perform(intent_score_id)
    score = IntentScore.find(intent_score_id)
    
    Rails.logger.info("[NotifyIntentChangeJob] score=#{score.id} level=#{score.intent_level}")
    
    # Only notify on actionable levels
    return unless score.actionable?
    
    # TODO: Integrate with notification system
    # Examples:
    # - Send Slack message to sales team
    # - Create CRM task
    # - Send email alert
    # - Push notification to mobile app
    
    # For now, just log
    message = "🔥 INTENT ALERT: Company #{score.company.name} is #{score.thermometer_emoji} #{score.intent_level.upcase} (#{score.total_score} pts) - SLA: #{score.sla_window}"
    
    Rails.logger.warn(message)
    
    # Future: ActionCable broadcast
    # ActionCable.server.broadcast(
    #   "intent_alerts_#{score.company_id}",
    #   { score: score, message: message }
    # )
  end
end
