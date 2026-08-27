# frozen_string_literal: true

class CreatorTreeSetting < ApplicationRecord
  MAX_JSON_BYTES = 64.kilobytes
  MAX_JSON_DEPTH = 4
  SAFE_KEY = /\A[a-zA-Z][a-zA-Z0-9_-]*\z/
  ALLOWED_THEMES = %w[solar dark glass monochrome neo].freeze
  belongs_to :reviewer, class_name: 'ReviewerProfile'
  has_one_attached :background_image

  validates :theme_key, inclusion: { in: ALLOWED_THEMES }
  validate :validate_json_attributes
  validates :reviewer_id, uniqueness: true
  after_commit :invalidate_public_tree_cache

  def invalidate_public_tree_cache
    slug = reviewer&.public_slug
    Rails.cache.delete("creator/public-tree/#{slug}/v1") if slug.present?
  end

  private

  def validate_json_attributes
    validate_json_attribute(:appearance)
    validate_json_attribute(:config)
  end

  def validate_json_attribute(attribute)
    value = public_send(attribute)
    unless value.is_a?(Hash)
      errors.add(attribute, "deve ser um objeto JSON")
      return
    end

    serialized = JSON.generate(value)
    errors.add(attribute, "excede o limite de 64KB") if serialized.bytesize > MAX_JSON_BYTES
    validate_json_structure(value, attribute, 1)
  rescue JSON::GeneratorError, TypeError
    errors.add(attribute, "contém valores JSON inválidos")
  end

  def validate_json_structure(value, attribute, depth)
    if depth > MAX_JSON_DEPTH
      errors.add(attribute, "excede a profundidade máxima de 4 níveis")
      return
    end

    value.each do |key, child|
      unless key.to_s.match?(SAFE_KEY)
        errors.add(attribute, "contém chave inválida")
        break
      end
      validate_json_structure(child, attribute, depth + 1) if child.is_a?(Hash)
      child.each { |nested| validate_json_structure(nested, attribute, depth + 1) } if child.is_a?(Array)
    end if value.is_a?(Hash)
  end
end
