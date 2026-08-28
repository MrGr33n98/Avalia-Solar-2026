# frozen_string_literal: true

require 'uri'
require 'pathname'

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
  def file_url
    return nil unless file.attached?
    begin
      storage_options = Rails.application.config.active_storage.respond_to?(:default_url_options) ?
        Rails.application.config.active_storage.default_url_options : nil
      options = (storage_options.presence || Rails.application.routes.default_url_options).dup
      if options[:host].blank?
        fallback_origin = ENV['ACTIVE_STORAGE_HOST'].presence || ENV['APP_HOST'].presence ||
                          (Rails.env.test? ? 'http://www.example.com' : 'https://api.avaliasolar.com.br')
        fallback_uri = URI.parse(fallback_origin)
        options[:host] = fallback_uri.host || fallback_origin
        options[:protocol] ||= fallback_uri.scheme || 'https'
      end
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_storage_proxy_url(file, options)
    rescue StandardError => e
      Rails.logger.error("Error generating file URL for asset #{id}: #{e.message}")
      nil
    end
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
    declared_is_generic = %w[application/octet-stream binary/octet-stream].include?(declared_type)
    errors.add(:file, 'tipo de arquivo não permitido') unless allowed.include?(detected_type) && (allowed.include?(declared_type) || declared_is_generic)
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
    change = attachment_changes[file.name.to_s]
    if change.present?
      attachable = change.attachable
      if attachable.respond_to?(:path)
        return Marcel::MimeType.for(Pathname.new(attachable.path), name: file.blob.filename.to_s)
      elsif attachable.respond_to?(:tempfile) && attachable.tempfile.respond_to?(:path)
        return Marcel::MimeType.for(Pathname.new(attachable.tempfile.path), name: file.blob.filename.to_s)
      elsif attachable.respond_to?(:read)
        return Marcel::MimeType.for(attachable, name: file.blob.filename.to_s)
      end
    end

    file.blob.open do |tempfile|
      Marcel::MimeType.for(tempfile, name: file.blob.filename.to_s)
    end
  rescue StandardError => e
    Rails.logger.error("Error detecting content type for asset #{id || 'new'}: #{e.message}")
    nil
  end
end
