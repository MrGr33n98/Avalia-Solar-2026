class VoiceReviewAsset < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session
  has_many :voice_review_transcripts, dependent: :restrict_with_exception
  has_one_attached :file, service: :voice_reviews

  enum status: { stored: 'stored', processing: 'processing', purged: 'purged', rejected: 'rejected' }
  before_validation :ensure_id

  validates :provider_media_id, :storage_key, :sha256, :mime_type, presence: true
  validates :byte_size, numericality: { greater_than: 0 }
  validates :mime_type, format: { with: %r{\A(audio/|text/)} }

  def private?
    blob = stored_blob
    blob.nil? || blob.service_name.to_s.exclude?('public')
  end

  def stored_blob
    return file.blob if file.attached?

    ActiveStorage::Blob.find_by(key: storage_key) if storage_key.present?
  end

  def audio_attached?
    stored_blob.present?
  end

  def download_audio_bytes
    stored_blob&.download
  end

  def upload_bytes!(bytes)
    service = ActiveStorage::Blob.services.fetch(:voice_reviews) { ActiveStorage::Blob.service }.name
    ActiveStorage::Blob.find_by(key: storage_key)&.purge
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(bytes), filename: "#{id}.audio", content_type: mime_type, key: storage_key, service_name: service
    )
    update!(byte_size: bytes.bytesize, status: 'stored')
  end

  def purge!
    stored_blob&.purge
    file.purge if file.attached?
    update!(status: 'purged', storage_key: "purged/#{id}")
  end

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
