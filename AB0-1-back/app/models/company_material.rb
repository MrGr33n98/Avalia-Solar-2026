# frozen_string_literal: true

class CompanyMaterial < ApplicationRecord
  STATUSES = %w[draft pending published rejected archived].freeze
  GATE_MODES = %w[none form request_access].freeze

  belongs_to :company
  belongs_to :content_lead_form, optional: true
  has_many :digital_assets, as: :attachable, dependent: :destroy
  has_many :material_downloads, dependent: :restrict_with_error
  has_many :content_moderation_decisions, as: :moderatable, dependent: :destroy

  validates :title, :slug, :material_type, :status, presence: true
  validates :slug, uniqueness: { scope: :company_id }, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :status, inclusion: { in: STATUSES }
  validates :gate_mode, inclusion: { in: GATE_MODES }
  validates :content_lead_form, presence: true, unless: -> { gate_mode == 'none' }
  validate :form_belongs_to_company
  validate :published_requires_published_at

  scope :published, -> { where(status: 'published').where('published_at <= ?', Time.current).where('expires_at IS NULL OR expires_at > ?', Time.current) }

  before_validation :generate_unique_slug, if: -> { slug.blank? && title.present? }
  before_save :normalize_publication_state

  # ---------------------------------------------------------------
  # Publicação centralizada — único ponto de entrada para publicar
  # ---------------------------------------------------------------
  def publish!
    raise 'Material não possui PDF pronto para publicação' unless publishable?

    transaction do
      update!(
        status: 'published',
        published_at: Time.current,
        moderation_reason: nil
      )

      digital_assets
        .where.not(status: 'archived')
        .where(processing_status: 'ready')
        .update_all(status: 'published')

      Rails.logger.info("[CompanyMaterial#publish!] material_id=#{id} company_id=#{company_id} status=published slug=#{slug}")
    end
  end

  # ---------------------------------------------------------------
  # Despublicação centralizada — reverte material e assets
  # ---------------------------------------------------------------
  def unpublish!(target_status: 'draft', reason: nil)
    transaction do
      update!(
        status: target_status,
        published_at: nil,
        moderation_reason: reason
      )

      digital_assets
        .where(status: 'published')
        .update_all(status: 'pending')

      Rails.logger.info("[CompanyMaterial#unpublish!] material_id=#{id} company_id=#{company_id} target_status=#{target_status} reason=#{reason}")
    end
  end

  # Verifica se existe pelo menos um DigitalAsset document pronto
  def publishable?
    digital_assets.document.where.not(status: 'archived').where(processing_status: 'ready').exists?
  end

  def gated?
    gate_mode != 'none'
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id content_lead_form_id title slug material_type visibility gate_mode status published_at expires_at download_count created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company content_lead_form digital_assets material_downloads]
  end

  private

  # Impede estado inconsistente: published_at só existe quando status=published
  def normalize_publication_state
    self.published_at = nil unless status == 'published'
  end

  def published_requires_published_at
    return unless status == 'published' && published_at.blank?

    errors.add(:published_at, 'deve estar presente quando o material está publicado')
  end

  def generate_unique_slug
    base_slug = title.to_s.parameterize.presence || 'material'
    candidate = base_slug
    suffix = 2

    while self.class.where(company_id: company_id, slug: candidate).where.not(id: id).exists?
      candidate = "#{base_slug}-#{suffix}"
      suffix += 1
    end

    self.slug = candidate
  end

  def form_belongs_to_company
    return if content_lead_form.blank? || content_lead_form.company_id == company_id

    errors.add(:content_lead_form, 'deve pertencer à mesma empresa')
  end
end
