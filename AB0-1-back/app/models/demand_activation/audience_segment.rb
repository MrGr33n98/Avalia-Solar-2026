# frozen_string_literal: true

module DemandActivation
  class AudienceSegment < ApplicationRecord
    self.table_name = 'demand_activation_audience_segments'

    belongs_to :company
    belongs_to :created_by, class_name: 'User'
    belongs_to :source, class_name: 'DemandActivation::Source', optional: true
    has_many :sync_jobs, class_name: 'DemandActivation::SyncJob', foreign_key: :audience_segment_id, dependent: :restrict_with_error

    STATUSES = %w[draft archived].freeze

    validates :name, presence: true, length: { maximum: 120 }
    validates :status, inclusion: { in: STATUSES }
    validate :safe_filter_definition
    validate :same_tenant_source

    before_update :increment_definition_version

    def editable?
      status == 'draft'
    end

    private

    def safe_filter_definition
      return errors.add(:filter_definition, 'inválidos') unless filter_definition.is_a?(Hash)

      # Never accept arbitrary email/phone/CRM fields from the marketplace.
      allowed = %w[region segment customer_type]
      errors.add(:filter_definition, 'contém filtros não permitidos') if (filter_definition.keys - allowed).any?
      filter_definition.each do |key, value|
        errors.add(:filter_definition, "#{key} inválido") unless value.is_a?(String) && value.length <= 80 && !value.include?('@')
      end
    end

    def same_tenant_source
      errors.add(:source, 'não pertence à empresa') if source && source.company_id != company_id
    end

    def increment_definition_version
      self.version += 1 if will_save_change_to_name? || will_save_change_to_filter_definition? || will_save_change_to_source_id?
    end
  end
end
