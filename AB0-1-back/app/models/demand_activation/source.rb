# frozen_string_literal: true

module DemandActivation
  class Source < ApplicationRecord
    self.table_name = 'demand_activation_sources'

    belongs_to :company
    belongs_to :created_by, class_name: 'User'
    has_many :audience_segments, class_name: 'DemandActivation::AudienceSegment', foreign_key: :source_id, dependent: :restrict_with_error

    KINDS = %w[company_first_party].freeze
    STATUSES = %w[pending verified rejected revoked].freeze

    validates :name, presence: true, length: { maximum: 120 }
    validates :kind, inclusion: { in: KINDS }
    validates :verification_status, inclusion: { in: STATUSES }
    validate :provenance_is_metadata_only

    def eligible?
      active? && verification_status == 'verified'
    end

    private

    def provenance_is_metadata_only
      return errors.add(:provenance, 'inválida') unless provenance.is_a?(Hash)
      allowed = %w[purpose legal_basis attestation_version policy_version reviewed_at]
      errors.add(:provenance, 'contém chaves não permitidas') if (provenance.keys - allowed).any?
    end
  end
end
