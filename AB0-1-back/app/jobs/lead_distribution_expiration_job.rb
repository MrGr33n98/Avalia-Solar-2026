class LeadDistributionExpirationJob < ApplicationJob
  queue_as :default

  def perform(distribution_id)
    distribution = LeadDistribution.find(distribution_id)
    return unless distribution.sent_status? || distribution.viewed_status?
    return unless distribution.sent_at.present? && distribution.sent_at <= LeadDistribution.acceptance_sla_minutes.minutes.ago

    LeadDistribution.transaction do
      distribution.update!(status: 'expired', expired_at: Time.current)

      # Track events
      Analytics::TrackEventService.call(
        company_id: distribution.company_id,
        event_type: 'lead_distribution_expired',
        metadata: { lead_id: distribution.lead_id, distribution_id: distribution.id }
      )

      Analytics::TrackEventService.call(
        company_id: distribution.company_id,
        event_type: 'lead_rerouted',
        metadata: { lead_id: distribution.lead_id, distribution_id: distribution.id }
      )

      LeadRoutingJob.perform_later(distribution.lead_id)
    end
  end
end
