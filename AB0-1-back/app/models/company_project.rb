# frozen_string_literal: true

class CompanyProject < ApplicationRecord
  STATUSES = %w[draft pending published rejected archived].freeze

  belongs_to :company
  has_many :digital_assets, as: :attachable, dependent: :destroy
  has_many :content_moderation_decisions, as: :moderatable, dependent: :destroy

  validates :title, :slug, :status, presence: true
  validates :slug, uniqueness: { scope: :company_id }, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :status, inclusion: { in: STATUSES }
  validates :capacity_value, numericality: { greater_than: 0 }, allow_nil: true

  scope :published, -> { where(status: 'published').where('published_at <= ?', Time.current) }
  scope :ordered, -> { order(position: :asc, published_at: :desc, created_at: :desc) }

  before_validation :generate_slug, if: -> { slug.blank? && title.present? }

  def publish!
    update!(status: 'published', published_at: Time.current, moderation_reason: nil)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id title slug project_type segment technology city state capacity_value capacity_unit status published_at position created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company digital_assets]
  end

  private

  def generate_slug
    self.slug = title.to_s.parameterize
  end
end
