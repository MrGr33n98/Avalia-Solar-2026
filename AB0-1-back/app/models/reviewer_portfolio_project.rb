# frozen_string_literal: true

class ReviewerPortfolioProject < ApplicationRecord
  PROJECT_TYPES = %w[residential commercial rural industrial ev_charging bess_storage].freeze
  STATUSES = %w[draft active disabled].freeze
  VISIBILITIES = %w[private public].freeze
  VERIFICATION_STATUSES = %w[self_declared under_review evidence_verified rejected].freeze

  ALLOWED_IMAGE_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze
  MAX_IMAGE_SIZE = 5.megabytes
  MAX_IMAGES_COUNT = 5

  PROJECT_TYPE_LABELS = {
    'residential' => 'Residencial',
    'commercial' => 'Comercial',
    'rural' => 'Rural / Agro',
    'industrial' => 'Industrial',
    'ev_charging' => 'Eletromobilidade / Recarga',
    'bess_storage' => 'Armazenamento de Energia (BESS)'
  }.freeze

  belongs_to :user
  has_many :project_brands,
           class_name: 'ReviewerPortfolioProjectBrand',
           foreign_key: :reviewer_portfolio_project_id,
           dependent: :destroy
  has_many :brand_usages,
           through: :project_brands,
           source: :reviewer_brand_usage
  has_many :events,
           class_name: 'ReviewerPortfolioProjectEvent',
           foreign_key: :reviewer_portfolio_project_id,
           dependent: :destroy
  has_many_attached :images

  validates :title, presence: true, length: { maximum: 160 }
  validates :project_type, presence: true, inclusion: { in: PROJECT_TYPES }
  validates :status, inclusion: { in: STATUSES }
  validates :visibility, inclusion: { in: VISIBILITIES }
  validates :verification_status, inclusion: { in: VERIFICATION_STATUSES }
  validates :capacity_kwp, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :state, length: { is: 2 }, allow_nil: true

  validate :dates_cannot_be_in_future
  validate :completed_at_cannot_precede_started_at
  validate :consent_required_for_public_visibility
  validate :validate_attached_images

  scope :active, -> { where(status: 'active') }
  scope :publicly_visible, -> { active.where(visibility: 'public') }
  scope :verified, -> { active.where(verification_status: 'evidence_verified') }

  after_commit :invalidate_creator_cache

  def project_type_label
    PROJECT_TYPE_LABELS[project_type] || project_type.humanize
  end

  def as_owner_json
    {
      id: id.to_s,
      title: title,
      project_type: project_type,
      project_type_label: project_type_label,
      city: city,
      state: state,
      started_at: started_at&.iso8601,
      completed_at: completed_at&.iso8601,
      capacity_kwp: capacity_kwp&.to_f,
      visibility: visibility,
      verification_status: verification_status,
      status: status,
      description: description,
      lock_version: lock_version,
      brands: brand_usages.active.includes(:brand).map do |bu|
        {
          id: bu.id.to_s,
          brand_id: bu.brand_id,
          brand_name: bu.brand.name,
          brand_slug: bu.brand.slug,
          initials: bu.brand.initials,
          logo_url: bu.brand.logo_url
        }
      end,
      created_at: created_at.iso8601,
      updated_at: updated_at.iso8601
    }
  end

  def as_public_json
    {
      id: id.to_s,
      title: title,
      project_type: project_type,
      project_type_label: project_type_label,
      city: city,
      state: state,
      completed_at: completed_at&.iso8601,
      capacity_kwp: capacity_kwp&.to_f,
      verification_status: verification_status,
      brands: brand_usages.active.where(visibility: 'public').includes(:brand).map do |bu|
        {
          brand_name: bu.brand.name,
          initials: bu.brand.initials,
          logo_url: bu.brand.logo_url
        }
      end
    }
  end

  private

  def dates_cannot_be_in_future
    today = Time.zone.today
    if started_at.present? && started_at > today
      errors.add(:started_at, 'não pode ser uma data futura')
    end
    if completed_at.present? && completed_at > today
      errors.add(:completed_at, 'não pode ser uma data futura')
    end
  end

  def completed_at_cannot_precede_started_at
    return unless started_at.present? && completed_at.present?

    if completed_at < started_at
      errors.add(:completed_at, 'não pode ser anterior à data de início')
    end
  end

  def consent_required_for_public_visibility
    return unless visibility == 'public'

    if consent_version.blank?
      errors.add(:consent_version, 'é obrigatório para projetos públicos')
    end
  end

  def validate_attached_images
    return unless images.attached?

    if images.length > MAX_IMAGES_COUNT
      errors.add(:images, "limite de #{MAX_IMAGES_COUNT} imagens excedido")
    end

    images.each do |image|
      if image.blob.byte_size > MAX_IMAGE_SIZE
        errors.add(:images, "tamanho máximo por imagem é 5MB (#{image.filename})")
      end

      unless ALLOWED_IMAGE_TYPES.include?(image.blob.content_type)
        errors.add(:images, "formato não permitido: #{image.blob.content_type}")
      end
    end
  end

  def invalidate_creator_cache
    Creator::PublicProfileService.invalidate_for_user(user) if defined?(Creator::PublicProfileService)
  end
end
