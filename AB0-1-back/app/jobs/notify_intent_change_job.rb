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

    # Notifica time de Vendas via Slack
    SlackNotificationService.notify_intent_change(score)

    # For now, just log
    message = "🔥 INTENT ALERT: Company #{score.company.name} is #{score.thermometer_emoji} #{score.intent_level.upcase} (#{score.total_score} pts) - SLA: #{score.sla_window}"

    Rails.logger.warn(message)

    return unless score.company.can_use_webhooks?

    event_name = event_name_for(score.intent_level)
    return if event_name.blank?

    payload = {
      intent_score_id: score.id,
      company_id: score.company_id,
      lead_id: score.lead_id,
      anonymous_id: score.anonymous_id,
      total_score: score.total_score,
      intent_level: score.intent_level,
      recommended_action: score.recommended_action,
      sla_window: score.sla_window,
      last_interaction_at: score.last_interaction_at&.iso8601
    }

    CompanyWebhook.active.for_event(event_name).where(company_id: score.company_id).find_each do |webhook|
      WebhookDeliveryJob.perform_later(webhook.id, event_name, payload)
    end
  end

  private

  def event_name_for(intent_level)
    case intent_level
    when 'hot' then 'intent.hot'
    when 'boiling' then 'intent.boiling'
    when 'immediate' then 'intent.immediate'
    when 'declared' then 'intent.declared'
    end
  end
end
