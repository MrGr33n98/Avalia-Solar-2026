require "uri"
class ReviewerProfile < ApplicationRecord
  belongs_to :user
  delegate :avatar_url, to: :user, allow_nil: true
  has_many :creator_tree_blocks, foreign_key: :reviewer_id, inverse_of: :reviewer, dependent: :destroy
  has_one :creator_tree_setting, foreign_key: :reviewer_id, dependent: :destroy
  has_one_attached :public_banner
  validates :bio, length: { maximum: 2000 }, allow_blank: true
  validates :linkedin_url, :instagram_url, :website_url, :whatsapp_url, length: { maximum: 500 }, allow_blank: true
  validate :whatsapp_url_format

  private

  def whatsapp_url_format
    return if whatsapp_url.blank?

    uri = URI.parse(whatsapp_url)
    return if uri.is_a?(URI::HTTP) && uri.host.present? && uri.host.downcase.in?(['wa.me', 'api.whatsapp.com'])

    errors.add(:whatsapp_url, 'deve ser um link wa.me ou api.whatsapp.com válido')
  rescue URI::InvalidURIError
    errors.add(:whatsapp_url, 'deve ser um link WhatsApp válido')
  end

  public

  def self.ransackable_attributes(_auth_object = nil)
    %w[id user_id profession company_name bio birth_date linkedin_url instagram_url website_url whatsapp_url public_profile created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[user]
  end
end
