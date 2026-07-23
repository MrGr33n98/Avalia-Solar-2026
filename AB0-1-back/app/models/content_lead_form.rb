# frozen_string_literal: true

class ContentLeadForm < ApplicationRecord
  STATUSES = %w[active inactive].freeze
  FIELD_TYPES = %w[text email tel select].freeze
  RESERVED_FIELD_KEYS = %w[name email phone company_name].freeze

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
    unless fields.is_a?(Array) && fields.any?
      errors.add(:fields, 'deve conter ao menos um campo')
      return
    end

    keys = fields.map { |field| field.is_a?(Hash) ? field['key'].to_s : nil }
    if keys.any?(&:blank?) || keys.uniq.size != keys.size || keys.any? { |key| key !~ /\A[a-z][a-z0-9_]{0,63}\z/ }
      errors.add(:fields, 'deve conter chaves únicas em snake_case')
    end
    if fields.any? { |field| !field.is_a?(Hash) || !FIELD_TYPES.include?(field['type'].to_s) }
      errors.add(:fields, 'contém um tipo de campo não suportado')
    end
    if fields.any? { |field| field.is_a?(Hash) && field['type'].to_s == 'select' && Array(field['options']).reject(&:blank?).empty? }
      errors.add(:fields, 'do tipo lista precisam de opções')
    end
    errors.add(:fields, 'deve conter um campo de e-mail obrigatório') unless fields.any? { |field| field.is_a?(Hash) && field['key'].to_s == 'email' && ActiveModel::Type::Boolean.new.cast(field['required']) }
  end
end
