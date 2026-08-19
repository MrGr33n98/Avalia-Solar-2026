class LeadDistributionExpirationJob < ApplicationJob
  queue_as :default

  def perform(distribution_id)
    distribution = LeadDistribution.find(distribution_id)
    return unless distribution.sent? || distribution.viewed?
    return unless distribution.sent_at.present? && distribution.sent_at <= LeadDistribution.acceptance_sla_minutes.minutes.ago

    distribution.update!(status: 'expired', expired_at: Time.current)
    LeadRoutingJob.perform_later(distribution.lead_id)
  end
end
