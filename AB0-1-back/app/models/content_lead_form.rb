# frozen_string_literal: true

class ContentLeadForm < ApplicationRecord
  STATUSES = %w[active inactive].freeze

  belongs_to :company
  has_many :company_materials, dependent: :restrict_with_error
  has_many :material_downloads, dependent: :restrict_with_error

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validate :fields_are_supported

  scope :active, -> { where(status: 'active') }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id name status version privacy_url created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company company_materials material_downloads]
  end

  private

  def fields_are_supported
    return unless fields.is_a?(Array)

    invalid = fields.any? { |field| !field.is_a?(Hash) || field['key'].to_s.blank? }
    errors.add(:fields, 'deve conter campos com chave') if invalid
  end
end
