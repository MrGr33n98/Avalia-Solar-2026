class ProductSpecification < ApplicationRecord
  belongs_to :product
  belongs_to :spec_template

  validates :spec_template_id, uniqueness: { scope: :product_id }
  validate :value_presence_for_required

  delegate :key, :label, :value_type, :unit, :filterable, :sortable, :comparable, :seo_weight, to: :spec_template

  def value
    case value_type
    when 'decimal', 'integer'
      value_number
    when 'boolean'
      value_boolean
    when 'enum', 'string'
      value_string
    when 'range', 'json'
      value_json
    else
      value_json || value_string || value_number
    end
  end

  def assign_typed_value(raw_value)
    case value_type
    when 'decimal', 'integer'
      self.value_number = raw_value.present? ? raw_value.to_d : nil
      self.value_string = raw_value.to_s if raw_value.present?
    when 'boolean'
      self.value_boolean = ActiveModel::Type::Boolean.new.cast(raw_value)
    when 'enum', 'string'
      self.value_string = raw_value.to_s
    when 'range', 'json'
      self.value_json = raw_value
    else
      self.value_json = raw_value
    end
  end

  private

  def value_presence_for_required
    return unless spec_template&.required?

    errors.add(:base, "value required for #{spec_template.key}") if value.blank?
  end
end
