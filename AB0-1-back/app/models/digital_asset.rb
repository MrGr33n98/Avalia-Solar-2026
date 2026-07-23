# frozen_string_literal: true

require 'uri'

class DigitalAsset < ApplicationRecord
  KINDS = %w[image video document].freeze
  STATUSES = %w[pending published rejected quarantined archived].freeze
  PROCESSING_STATUSES = %w[pending processing ready failed quarantined].freeze

  belongs_to :company
  belongs_to :attachable, polymorphic: true
  has_one_attached :file
  has_many :content_moderation_decisions, as: :moderatable, dependent: :destroy

  validates :kind, inclusion: { in: KINDS }
  validates :status, inclusion: { in: STATUSES }
  validates :processing_status, inclusion: { in: PROCESSING_STATUSES }
  validate :external_video_or_file_present
  validate :file_is_allowed
  validate :external_url_is_safe
  validate :external_video_provider_is_allowed
  validate :company_matches_attachable

  scope :published, -> { where(status: 'published', processing_status: 'ready').order(position: :asc) }
  scope :document, -> { where(kind: 'document') }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id attachable_type attachable_id kind title status processing_status provider created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company attachable]
  end

  private

  def external_video_or_file_present
    return if file.attached? || external_url.present?

    errors.add(:base, 'arquivo ou URL externa é obrigatório')
  end

  def file_is_allowed
    return unless file.attached?

    allowed = case kind
              when 'image' then %w[image/jpeg image/png image/webp]
              when 'document' then %w[application/pdf]
              else []
              end
    declared_type = file.blob.content_type
    detected_type = detected_content_type
    errors.add(:file, 'tipo de arquivo não permitido') unless allowed.include?(declared_type) && allowed.include?(detected_type)
    errors.add(:file, 'arquivo excede 25 MB') if file.blob.byte_size > 25.megabytes
  end

  def external_url_is_safe
    return if external_url.blank?

    uri = URI.parse(external_url)
    errors.add(:external_url, 'deve usar HTTPS') unless uri.is_a?(URI::HTTPS) && uri.host.present?
  rescue URI::InvalidURIError
    errors.add(:external_url, 'inválida')
  end

  def company_matches_attachable
    return unless attachable.respond_to?(:company_id) && attachable.company_id.present? && company_id.present?
    return if attachable.company_id == company_id

    errors.add(:company, 'deve ser a empresa do recurso associado')
  end

  def external_video_provider_is_allowed
    return unless kind == 'video' && external_url.present?

    host = URI.parse(external_url).host.to_s.downcase.sub(/\Awww\./, '')
    allowed = %w[youtube.com youtu.be vimeo.com]
    errors.add(:external_url, 'provedor de vídeo não permitido') unless allowed.include?(host)
  rescue URI::InvalidURIError
    # URL inválida já é tratada pela validação de segurança.
  end

  def detected_content_type
    file.blob.open do |tempfile|
      Marcel::MimeType.for(tempfile, name: file.blob.filename.to_s)
    end
  rescue StandardError
    nil
  end
end
