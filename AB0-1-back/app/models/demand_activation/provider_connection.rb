# frozen_string_literal: true

module DemandActivation
  class ProviderConnection < ApplicationRecord
    self.table_name = 'demand_activation_provider_connections'

    PROVIDERS = %w[linkedin meta google].freeze
    STATUSES = %w[not_connected pending_review connected expired revoked error].freeze

    belongs_to :company
    belongs_to :created_by, class_name: 'User'
    has_many :sync_jobs, class_name: 'DemandActivation::SyncJob', foreign_key: :provider_connection_id, dependent: :restrict_with_error

    validates :provider, inclusion: { in: PROVIDERS }
    validates :status, inclusion: { in: STATUSES }
    validates :provider, uniqueness: { scope: :company_id }

    # This foundation intentionally has no token fields and cannot initiate OAuth.
    def operational?
      false
    end
  end
end
