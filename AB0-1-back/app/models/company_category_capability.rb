# frozen_string_literal: true

class CompanyCategoryCapability < ApplicationRecord
  CAPABILITY_TYPES = %w[
    installation
    maintenance
    project_engineering
    equipment_supply
    monitoring
    software
    financing
    monitoring_software
    field_om
    inspection
    consulting
  ].freeze

  SERVICE_DELIVERY_MODES = %w[saas field_service hybrid consulting].freeze
  CURATION_STATUSES = %w[draft verified rejected].freeze

  belongs_to :company
  belongs_to :category
  belongs_to :category_solution_type, optional: true

  validates :capability_type, inclusion: { in: CAPABILITY_TYPES }
  validates :service_delivery_mode, inclusion: { in: SERVICE_DELIVERY_MODES }, allow_nil: true
  validates :curation_status, inclusion: { in: CURATION_STATUSES }, allow_nil: true
  validate :attributes_json_must_be_an_object
  validate :evidence_json_must_be_an_object

  scope :verified, -> { where(verified: true) }
  scope :curated_public, -> { where(verified: true).where(curation_status: [nil, 'verified']) }
  scope :by_capability_type, ->(type) { where(capability_type: type.to_s) if type.present? }
  scope :saas_delivery, -> { where(service_delivery_mode: 'saas').or(where(capability_type: %w[software monitoring_software])) }
  scope :field_delivery, -> { where(service_delivery_mode: %w[field_service hybrid]).or(where(capability_type: %w[installation maintenance field_om inspection])) }

  private

  def attributes_json_must_be_an_object
    errors.add(:attributes_json, 'deve ser um objeto JSON') unless attributes_json.is_a?(Hash)
  end

  def evidence_json_must_be_an_object
    return unless respond_to?(:evidence_json) && !evidence_json.nil?

    errors.add(:evidence_json, 'deve ser um objeto JSON') unless evidence_json.is_a?(Hash)
  end
end
