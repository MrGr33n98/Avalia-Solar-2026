class DirectMessage < ApplicationRecord
  MAX_ATTACHMENT_SIZE = 10.megabytes
  ALLOWED_ATTACHMENT_TYPES = %w[
    image/jpeg
    image/png
    image/webp
    application/pdf
  ].freeze

  belongs_to :conversation
  belongs_to :sender, class_name: 'User', optional: true
  has_many_attached :attachments

  validates :sender_type, inclusion: { in: %w[User Company] }
  validates :client_message_id, uniqueness: { scope: :conversation_id }, allow_blank: true
  validate :body_or_attachment_present
  validate :attachments_are_safe

  before_validation :normalize_body
  before_create :mark_delivered

  private

  def normalize_body
    self.body = body.to_s.strip.presence
  end

  def mark_delivered
    self.delivered_at ||= Time.current
  end

  def body_or_attachment_present
    return if body.present? || attachments.attached?

    errors.add(:base, 'Mensagem ou anexo é obrigatório')
  end

  def attachments_are_safe
    attachments.each do |attachment|
      if attachment.blob.byte_size > MAX_ATTACHMENT_SIZE
        errors.add(:attachments, 'devem ter no máximo 10MB')
      end

      next if ALLOWED_ATTACHMENT_TYPES.include?(attachment.blob.content_type)

      errors.add(:attachments, 'aceitam apenas imagem ou PDF')
    end
  end
end
