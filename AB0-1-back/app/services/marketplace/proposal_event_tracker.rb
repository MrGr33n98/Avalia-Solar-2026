# frozen_string_literal: true

module Marketplace
  class ProposalEventTracker
    EVENT_TYPES = %w[
      proposal_created
      proposal_published
      proposal_viewed
      proposal_compared
      proposal_accepted
      proposal_declined
      proposal_change_requested
      meeting_scheduled
      project_started
      project_completed
    ].freeze

    def self.track(proposal:, event_type:, actor: nil, metadata: {})
      return unless proposal

      correlation = {
        lead_id: proposal.lead_id,
        lead_distribution_id: proposal.lead_distribution_id,
        proposal_id: proposal.id,
        version_number: proposal.current_version_number,
        company_id: proposal.company_id,
        buyer_user_id: proposal.buyer_user_id
      }.merge(metadata)

      proposal.events.create!(
        actor: actor,
        event_type: event_type.to_s,
        metadata: correlation,
        occurred_at: Time.current
      )

      # Log para observabilidade sem expor PII sensível
      Rails.logger.info(
        "[ProposalEventTracker] event=#{event_type} proposal_id=#{proposal.id} " \
        "reference=#{proposal.reference} company_id=#{proposal.company_id} actor_id=#{actor&.id}"
      )
    rescue StandardError => e
      Rails.logger.error("[ProposalEventTracker Error] event=#{event_type} error=#{e.message}")
    end
  end
end
