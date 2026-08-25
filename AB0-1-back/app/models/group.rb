# frozen_string_literal: true

class Group < ApplicationRecord
  has_one_attached :avatar
  has_many_attached :hero_images

  ALLOWED_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze
  MAX_AVATAR_SIZE = 2.megabytes
  MAX_HERO_SIZE = 5.megabytes

  VISIBILITIES = %w[public private_visible private_hidden].freeze
  MEMBERSHIP_MODES = %w[open approval invite_only].freeze
  POSTING_MODES = %w[members moderated admins_only].freeze
  STATUSES = %w[draft active archived suspended].freeze

  belongs_to :owner, class_name: 'User'
  belongs_to :category, optional: true
  has_many :group_memberships, dependent: :destroy
  has_many :members, through: :group_memberships, source: :user
  has_many :group_topics, dependent: :destroy
  has_many :group_rules, dependent: :destroy
  has_many :group_posts, dependent: :restrict_with_error
  has_many :active_group_topics, -> { active }, class_name: 'GroupTopic', inverse_of: :group
  has_many :active_group_rules, -> { active }, class_name: 'GroupRule', inverse_of: :group

  def self.ransackable_attributes(_auth_object = nil)
    %w[created_at featured id name official owner_id slug status updated_at verified visibility]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category group_memberships members owner]
  end

  validates :name, presence: true, length: { maximum: 120 }
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :description, length: { maximum: 10_000 }, allow_blank: true
  validates :short_description, length: { maximum: 240 }, allow_blank: true
  validates :visibility, inclusion: { in: VISIBILITIES }
  validates :membership_mode, inclusion: { in: MEMBERSHIP_MODES }
  validates :posting_mode, inclusion: { in: POSTING_MODES }
  validates :status, inclusion: { in: STATUSES }

  validate :validate_avatar
  validate :validate_hero_images

  scope :discoverable, -> { where(status: 'active', visibility: 'public') }
  scope :featured_groups, -> { discoverable.where(featured: true) }
  scope :newest, -> { order(created_at: :desc, id: :desc) }
  scope :most_active, -> { discoverable.order(posts_count: :desc, id: :desc) }

  def active_membership_for(user)
    return nil unless user

    group_memberships.find_by(user_id: user.id, status: 'active')
  end

  def avatar_url
    return unless avatar.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(avatar, options)
  rescue StandardError
    nil
  end

  def hero_preview_url
    return unless hero_images.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(hero_images.first, options)
  rescue StandardError
    nil
  end

  def hero_images_data
    return [] unless hero_images.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    hero_images.map do |image|
      {
        id: image.id,
        url: Rails.application.routes.url_helpers.rails_storage_proxy_url(image, options)
      }
    rescue StandardError
      nil
    end.compact
  end

  private

  def validate_avatar
    return unless avatar.attached?

    unless avatar.content_type.in?(ALLOWED_CONTENT_TYPES)
      errors.add(:avatar, 'deve ser PNG, JPEG, JPG ou WEBP')
    end

    if avatar.blob.byte_size > MAX_AVATAR_SIZE
      errors.add(:avatar, 'não pode exceder 2 MB')
    end
  end

  def validate_hero_images
    return unless hero_images.attached?

    if hero_images.count > 5
      errors.add(:hero_images, 'não pode ter mais do que 5 imagens')
    end

    hero_images.each do |image|
      unless image.content_type.in?(ALLOWED_CONTENT_TYPES)
        errors.add(:hero_images, "imagem #{image.filename} deve ser PNG, JPEG, JPG ou WEBP")
      end

      if image.blob.byte_size > MAX_HERO_SIZE
        errors.add(:hero_images, "imagem #{image.filename} não pode exceder 5 MB")
      end
    end
  end
end