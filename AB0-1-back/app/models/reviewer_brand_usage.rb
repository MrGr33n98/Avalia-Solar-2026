# frozen_string_literal: true

class ReviewerBrandUsage < ApplicationRecord
  USAGE_CONTEXTS = %w[
    personal_owner
    integrator_install
    designer_specification
    maintenance
    reseller
  ].freeze

  SOURCES = %w[manual review_form import_reviewed].freeze
  VISIBILITIES = %w[private public].freeze
  VERIFICATION_STATUSES = %w[
    self_declared
    under_review
    evidence_verified
    rejected
    revoked
  ].freeze
  STATUSES = %w[active disabled].freeze

  belongs_to :user
  belongs_to :brand
  belongs_to :source_review, class_name: 'Review', optional: true
  has_many :events, class_name: 'ReviewerBrandUsageEvent', dependent: :destroy

  validates :usage_context, presence: true, inclusion: { in: USAGE_CONTEXTS }
  validates :source, presence: true, inclusion: { in: SOURCES }
  validates :visibility, presence: true, inclusion: { in: VISIBILITIES }
  validates :verification_status, presence: true, inclusion: { in: VERIFICATION_STATUSES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :brand_id, uniqueness: {
    scope: %i[user_id usage_context],
    message: 'já cadastrado para este contexto de uso'
  }
  validate :validate_public_consent
  validate :validate_experience_date

  scope :active, -> { where(status: 'active') }
  scope :publicly_visible, -> { active.where(visibility: 'public') }
  scope :verified, -> { active.where(verification_status: 'evidence_verified') }

  after_commit :invalidate_creator_cache

  def as_owner_json
    {
      id: id.to_s,
      brand: brand.as_catalog_json,
      usage_context: usage_context,
      usage_context_label: usage_context_label,
      experience_since: experience_since&.iso8601,
      source: source,
      verification_status: verification_status,
      visibility: visibility,
      status: status,
      description: description,
      consent_version: consent_version,
      opted_in_at: opted_in_at&.iso8601,
      lock_version: lock_version,
      created_at: created_at.iso8601,
      updated_at: updated_at.iso8601
    }
  end

  def as_public_json
    {
      id: id.to_s,
      brand_id: brand_id,
      brand_name: brand.name,
      brand_slug: brand.slug,
      initials: brand.initials,
      logo_url: brand.logo_url,
      usage_context: usage_context,
      usage_context_label: usage_context_label,
      experience_since: experience_since&.iso8601,
      verification_status: verification_status
    }
  end

  def usage_context_label
    case usage_context
    when 'personal_owner' then 'Proprietário / Uso pessoal'
    when 'integrator_install' then 'Instalo em projetos'
    when 'designer_specification' then 'Especifico em projetos'
    when 'maintenance' then 'Realizo manutenção'
    when 'reseller' then 'Revendo equipamentos'
    else usage_context.humanize
    end
  end

  def opt_in_public!(version:)
    update!(
      visibility: 'public',
      consent_version: version,
      opted_in_at: Time.current
    )
  end

  def opt_out_public!
    update!(visibility: 'private')
  end

  def soft_delete!
    update!(status: 'disabled')
  end

  def reactivate!
    update!(status: 'active')
  end

  private

  def validate_public_consent
    return unless visibility == 'public'

    if opted_in_at.blank? || consent_version.blank?
      errors.add(:visibility, 'requer consentimento explícito e versão dos termos para perfil público')
    end
  end

  def validate_experience_date
    return if experience_since.blank?

    if experience_since > Date.current
      errors.add(:experience_since, 'não pode ser uma data futura')
    end
  end

  def invalidate_creator_cache
    return unless defined?(Creator::PublicProfileService) && Creator::PublicProfileService.respond_to?(:invalidate_for_user)

    Creator::PublicProfileService.invalidate_for_user(user)
  end
end
