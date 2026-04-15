class CategoryLeadWizard < ApplicationRecord
  belongs_to :category, inverse_of: :category_lead_wizard

  before_validation :normalize_json_fields

  validates :category_id, uniqueness: true, allow_nil: true
  validates :template_key, presence: true
  validate :validate_schema_format
  validate :validate_thank_you_config_format

  def self.ransackable_attributes(_auth_object = nil)
    %w[id category_id enabled template_key template_version created_at updated_at]
  end

  private

  def normalize_json_fields
    @schema_parse_error = false
    @thank_you_config_parse_error = false

    self.schema = parse_json_object(schema, :schema)
    self.thank_you_config = parse_json_object(thank_you_config, :thank_you_config)
  end

  def parse_json_object(value, attribute_name)
    return {} if value.nil?
    return value if value.is_a?(Hash)
    return value unless value.is_a?(String)

    stripped_value = value.strip
    return {} if stripped_value.empty?

    parsed = JSON.parse(stripped_value)
    return parsed if parsed.is_a?(Hash)

    mark_json_error(attribute_name)
    value
  rescue JSON::ParserError
    mark_json_error(attribute_name)
    value
  end

  def mark_json_error(attribute_name)
    instance_variable_set(:"@#{attribute_name}_parse_error", true)
  end

  def validate_schema_format
    errors.add(:schema, 'must be a valid JSON object') if @schema_parse_error
    return if schema.is_a?(Hash)

    errors.add(:schema, 'must be a valid JSON object')
  end

  def validate_thank_you_config_format
    errors.add(:thank_you_config, 'must be a valid JSON object') if @thank_you_config_parse_error
    return if thank_you_config.is_a?(Hash)

    errors.add(:thank_you_config, 'must be a valid JSON object')
  end
end
