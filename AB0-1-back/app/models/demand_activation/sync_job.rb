# frozen_string_literal: true

module DemandActivation
  class SyncJob < ApplicationRecord
    self.table_name = 'demand_activation_sync_jobs'

    STATUSES = %w[pending processing submitted partial_success success failed cancelled].freeze

    belongs_to :company
    belongs_to :audience_segment, class_name: 'DemandActivation::AudienceSegment'
    belongs_to :provider_connection, class_name: 'DemandActivation::ProviderConnection'

    validates :status, inclusion: { in: STATUSES }
    validates :idempotency_key, presence: true, uniqueness: { scope: :company_id }
    validate :same_tenant_references

    private

    def same_tenant_references
      if audience_segment && audience_segment.company_id != company_id
        errors.add(:audience_segment, 'não pertence à empresa')
      end
      if provider_connection && provider_connection.company_id != company_id
        errors.add(:provider_connection, 'não pertence à empresa')
      end
    end
  end
end
