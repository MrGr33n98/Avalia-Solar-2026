class Banner < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :company, optional: true
  belongs_to :approved_by_admin_user, class_name: 'AdminUser', optional: true
  has_one_attached :image

  MODERATION_STATUSES = %w[draft submitted approved rejected].freeze

  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { in: %w[rectangular_large rectangular_small] }
  validates :position, inclusion: { in: %w[navbar sidebar categories_top home_top companies_top] }
  validates :image, presence: true
  validates :moderation_status, inclusion: { in: MODERATION_STATUSES }, if: -> { self.class.column_names.include?('moderation_status') }

  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id company_id created_at id image_url title updated_at link active sponsored
       banner_type position start_date end_date moderation_status priority slot_key approved_by_admin_user_id approved_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category company approved_by_admin_user image_attachment image_blob]
  end

  scope :approved, -> { where(moderation_status: 'approved') }

  def submit_for_review!
    update!(moderation_status: 'submitted', active: false)
  end

  def approve!(admin_user)
    update!(
      moderation_status: 'approved',
      approved_by_admin_user: admin_user,
      approved_at: Time.current,
      rejected_reason: nil
    )
  end

  def reject!(admin_user, reason)
    update!(
      moderation_status: 'rejected',
      approved_by_admin_user: admin_user,
      approved_at: Time.current,
      active: false,
      rejected_reason: reason
    )
  end

  def link_url
    link
  end

  scope :currently_active, lambda {
    scope = where(active: true)
    if column_names.include?('moderation_status')
      scope = scope.where(moderation_status: 'approved')
    end
    if column_names.include?('start_date')
      scope = scope.where('start_date IS NULL OR start_date <= ?', Time.current)
    end
    if column_names.include?('end_date')
      scope = scope.where('end_date IS NULL OR end_date >= ?', Time.current)
    end
    scope
  }

  def image_url
    return nil unless image.attached?
    Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating banner image URL: #{e.message}")
    nil
  end

  def as_json(options = {})
    super(options).merge(image_url: image_url)
  end
end
