# frozen_string_literal: true

module Marketplace
  class ProposalBootstrapService
    INITIAL_TITLE = 'Proposta em preparação'

    def initialize(distribution:, created_by: nil)
      @distribution = distribution
      @created_by = created_by
    end

    def call
      proposal = nil
      distribution.with_lock do
        proposal = existing_proposal
        proposal = proposal ? sync_existing_proposal(proposal) : create_proposal
      end
      proposal
    rescue ActiveRecord::RecordNotUnique
      existing_proposal || raise
    end

    private

    attr_reader :distribution, :created_by

    def create_proposal
      proposal = MarketplaceProposal.create!(
        lead: distribution.lead,
        lead_distribution: distribution,
        company: distribution.company,
        buyer_user: buyer,
        created_by: created_by,
        reference: reference,
        status: 'draft',
        current_version_number: 1
      )
      proposal.versions.create!(number: 1, title: INITIAL_TITLE)
      proposal.record_event('proposal.prepared', metadata: { source: 'lead_distribution' })
      proposal
    end

    def existing_proposal
      MarketplaceProposal.find_by(lead_distribution_id: distribution.id) ||
        MarketplaceProposal.find_by(lead_id: distribution.lead_id, company_id: distribution.company_id)
    end

    def sync_existing_proposal(proposal)
      updates = {}
      updates[:buyer_user] = buyer if proposal.buyer_user_id.nil? && buyer
      updates[:created_by] = created_by if proposal.created_by_id.nil? && created_by
      proposal.update!(updates) if updates.any?
      ensure_initial_version!(proposal)
      proposal
    end

    def ensure_initial_version!(proposal)
      return unless proposal.status == 'draft' && proposal.versions.empty?

      proposal.versions.create!(number: 1, title: INITIAL_TITLE)
      proposal.update!(current_version_number: 1)
    end

    def buyer
      @buyer ||= User.where(role: 'review').find_by('LOWER(email) = LOWER(?)', distribution.lead.email.to_s)
    end

    def reference
      year = distribution.created_at&.year || Time.current.year
      "AS-#{year}-D#{distribution.id.to_s.rjust(8, '0')}"
    end
  end
end
