# app/models/pending_change.rb
class PendingChange < ApplicationRecord
  belongs_to :company
  belongs_to :user, optional: true
  belongs_to :approved_by, class_name: 'AdminUser', optional: true

  validates :change_type, presence: true
  validates :status, inclusion: { in: %w[pending approved rejected] }

  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :rejected, -> { where(status: 'rejected') }

  # Tipos de mudanças permitidos
  CHANGE_TYPES = %w[
    company_info
    categories
    banner
    logo
    product
    media
    cta_config
    access_request
  ].freeze

  validates :change_type, inclusion: { in: CHANGE_TYPES }

  # Ransack allowlist for associations
  def self.ransackable_associations(auth_object = nil)
    # Restrict to safe associations only
    allowed = %w[company user approved_by]
    # Optionally tailor by auth_object
    case auth_object
    when AdminUser
      allowed
    else
      allowed
    end
  end

  # Ransack allowlist for attributes
  def self.ransackable_attributes(auth_object = nil)
    %w[
      id change_type status created_at updated_at approved_at rejected_at applied_at
      company_id user_id approved_by_id
    ]
  end

  # Aplica as mudanças ao modelo principal
  def apply_changes!
    return unless status == 'approved'

    case change_type
    when 'company_info'
      apply_company_info_changes
    when 'categories'
      apply_category_changes
    when 'banner'
      apply_banner_changes
    when 'logo'
      apply_logo_changes
    when 'product'
      apply_product_changes
    when 'media'
      apply_media_changes
    when 'cta_config'
      apply_cta_changes
    when 'access_request'
      apply_access_request
    end

    update!(applied_at: Time.current)
  end

  private

  def apply_company_info_changes
    company.update!(data['attributes'])
  end

  def apply_category_changes
    case data['action']
    when 'add'
      data['category_ids'].each do |cat_id|
        company.categories << Category.find(cat_id) unless company.categories.exists?(cat_id)
      end
    when 'remove'
      company.categories.delete(data['category_ids'])
    end
  end

  def apply_banner_changes
    sid = data['signed_id'] || Array(data['signed_ids']).first
    return if sid.blank?
    begin
      blob = ActiveStorage::Blob.find_signed!(sid)
      company.banner.attach(blob)
    rescue => e
      Rails.logger.error "Failed to attach banner blob: #{e.message}"
    end
  end

  def apply_logo_changes
    sid = data['signed_id'] || Array(data['signed_ids']).first
    return if sid.blank?
    begin
      blob = ActiveStorage::Blob.find_signed!(sid)
      company.logo.attach(blob)
    rescue => e
      Rails.logger.error "Failed to attach logo blob: #{e.message}"
    end
  end

  def apply_product_changes
    # Logic for product changes
  end

  def apply_media_changes
    signed_ids = Array(data['signed_ids'])
    return if signed_ids.empty?
    signed_ids.each do |sid|
      begin
        blob = ActiveStorage::Blob.find_signed!(sid)
        company.media_assets.attach(blob)
      rescue => e
        Rails.logger.error "Failed to attach media blob: #{e.message}"
      end
    end
  end

  def apply_cta_changes
    company.update!(
      cta_primary_label: data['cta_primary_label'],
      cta_primary_url: data['cta_primary_url'],
      cta_secondary_label: data['cta_secondary_label'],
      cta_secondary_url: data['cta_secondary_url'],
      cta_whatsapp_template: data['cta_whatsapp_template']
    )
  end

  def apply_access_request
    return unless user
    user.update!(company: company)
  end
end
