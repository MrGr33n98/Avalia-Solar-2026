class VoiceReviewAsset < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session
  has_many :voice_review_transcripts, dependent: :restrict_with_exception
  has_one_attached :file, service: :voice_reviews

  enum status: { stored: 'stored', processing: 'processing', purged: 'purged', rejected: 'rejected' }
  before_validation :ensure_id

  validates :provider_media_id, :storage_key, :sha256, :mime_type, presence: true
  validates :byte_size, numericality: { greater_than: 0 }
  validates :mime_type, format: { with: %r{\Aaudio/} }

  def private?
    !file.attached? || file.blob.service_name.to_s.exclude?('public')
  end

  def purge!
    file.purge if file.attached?
    update!(status: 'purged', storage_key: "purged/#{id}")
  end

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
