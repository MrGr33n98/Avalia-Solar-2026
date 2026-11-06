# frozen_string_literal: true

class CategoryEditorialRevision < ApplicationRecord
  STATUSES = %w[draft review published archived].freeze

  belongs_to :category

  validates :version_number, presence: true,
                             numericality: { only_integer: true, greater_than: 0 },
                             uniqueness: { scope: :category_id }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :validate_payload_hash

  before_validation :sanitize_payload!

  scope :ordered, -> { order(version_number: :desc) }
  scope :published, -> { where(status: 'published') }
  scope :draft_or_review, -> { where(status: %w[draft review]) }

  def self.next_version_number_for(category_id)
    where(category_id: category_id).maximum(:version_number).to_i + 1
  end

  def self.capture_from_category!(category:, status: 'published', change_reason: nil, actor_id: nil)
    create!(
      category: category,
      version_number: next_version_number_for(category.id),
      status: status,
      change_reason: change_reason,
      created_by_id: actor_id,
      published_at: status == 'published' ? Time.current : nil,
      payload_json: {
        'name' => category.name,
        'seo_title' => category.seo_title,
        'seo_description' => category.respond_to?(:seo_description) ? category.seo_description : nil,
        'short_description' => category.short_description,
        'description' => category.description
      }.compact
    )
  end

  def self.sanitize_html_string(raw)
    return raw unless raw.is_a?(String)

    raw
      .gsub(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/i, '')
      .gsub(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '')
      .gsub(/(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/i, '\1="#"')
      .strip
  end

  def self.sanitize_value(value)
    case value
    when String
      sanitize_html_string(value)
    when Array
      value.map { |item| sanitize_value(item) }
    when Hash
      value.each_with_object({}) do |(key, val), acc|
        acc[key.to_s] = sanitize_value(val)
      end
    else
      value
    end
  end

  private

  def sanitize_payload!
    return unless payload_json.is_a?(Hash)

    self.payload_json = self.class.sanitize_value(payload_json)
  end

  def validate_payload_hash
    errors.add(:payload_json, 'deve ser um objeto JSON') unless payload_json.is_a?(Hash)
  end
end
