# frozen_string_literal: true

class LeadWizardField < ApplicationRecord
  FIELD_TYPES = %w[text email tel select radio checkbox currency zipcode slider textarea].freeze
  TARGETS = %w[lead wizard_answers].freeze

  belongs_to :lead_wizard_section, inverse_of: :lead_wizard_fields, touch: true
  has_many :lead_wizard_field_options, dependent: :destroy, inverse_of: :lead_wizard_field

  validates :key, presence: true, uniqueness: { scope: :lead_wizard_section_id }
  validates :label, presence: true
  validates :field_type, presence: true, inclusion: { in: FIELD_TYPES }
  validates :target, inclusion: { in: TARGETS }
  validates :position, numericality: { greater_than_or_equal_to: 0 }
  validates :min_value, :max_value, :step_value,
            numericality: { greater_than_or_equal_to: 0 },
            allow_nil: true
  validate :choice_fields_require_options
  validate :choice_fields_cannot_have_empty_options

  before_validation :normalize_fields
  before_validation :normalize_numeric_fields

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id lead_wizard_section_id key field_type label target placeholder help_text
      required position min_value max_value step_value error_message
      depends_on_field_key depends_on_operator depends_on_value default_value
      created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[lead_wizard_section lead_wizard_field_options]
  end

  private

  def normalize_fields
    self.key = key.to_s.strip
    self.field_type = field_type.to_s.strip.downcase
    self.target = LeadWizard::FieldTargets.normalize(target, key: key)
    self.position = 0 if position.nil?
  end

  def normalize_numeric_fields
    self.min_value = nil if min_value.respond_to?(:blank?) && min_value.blank?
    self.max_value = nil if max_value.respond_to?(:blank?) && max_value.blank?
    self.step_value = nil if step_value.respond_to?(:blank?) && step_value.blank?
  end

  def choice_fields_context_published?
    lead_wizard_section&.lead_wizard_version&.published?
  end

  def choice_fields_require_options
    return unless choice_fields_context_published?
    return unless field_type.in?(%w[select radio])
    return if lead_wizard_field_options.any?

    errors.add(:lead_wizard_field_options, 'precisa ter ao menos uma opção para campos de seleção')
  end

  def choice_fields_cannot_have_empty_options
    return unless choice_fields_context_published?
    return unless field_type.in?(%w[select radio])

    lead_wizard_field_options.each do |option|
      next if option.marked_for_destruction?
      next if option.label.present? && option.value.present?

      errors.add(:lead_wizard_field_options, 'não pode ter opções vazias')
      break
    end
  end
end
