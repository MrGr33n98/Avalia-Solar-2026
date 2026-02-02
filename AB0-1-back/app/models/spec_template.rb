class SpecTemplate < ApplicationRecord
  SUPPORTED_TYPES = %w[decimal integer boolean enum string range json].freeze

  has_many :product_specifications, dependent: :destroy

  validates :product_type, :key, :label, :value_type, presence: true
  validates :value_type, inclusion: { in: SUPPORTED_TYPES }
  validates :seo_weight, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 10 }

  before_validation :normalize_key

  scope :filterable, -> { where(filterable: true) }
  scope :comparable, -> { where(comparable: true) }

  def enum?
    value_type == 'enum'
  end

  def numeric?
    %w[decimal integer].include?(value_type)
  end

  def range?
    value_type == 'range'
  end

  private

  def normalize_key
    self.key = key.to_s.strip.downcase.gsub(/[^a-z0-9_]/, '_')
  end
end
