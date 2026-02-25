class AdminUser < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  otp_secret_key = begin
    raw_key = ENV['OTP_SECRET_KEY'].presence
    raw_key ||= Rails.application.credentials[:otp_secret_key]
    raw_key ||= Rails.application.secret_key_base

    key_len = ActiveSupport::MessageEncryptor.key_len
    raw_key.bytesize == key_len ? raw_key : ActiveSupport::KeyGenerator.new(raw_key).generate_key('otp_secret', key_len)
  end

  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :two_factor_authenticatable,
         otp_secret_encryption_key: otp_secret_key

  # Notifications association
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: 'Noticed::Notification'

  has_one_attached :avatar_photo

  # Two-Factor Authentication
  serialize :otp_backup_codes, type: Array, coder: YAML

  # Generate backup codes when enabling 2FA
  def generate_otp_backup_codes!
    codes = Array.new(10) { SecureRandom.hex(4) }
    self.otp_backup_codes = codes.map { |code| Devise.bcrypt(AdminUser, code) }
    codes # Return plain codes to show to user
  end

  # Validate backup code
  def validate_and_consume_otp_backup_code!(code)
    otp_backup_codes.to_a.each_with_index do |backup_code_digest, index|
      next unless Devise.secure_compare(Devise.bcrypt(AdminUser, code), backup_code_digest)

      codes = otp_backup_codes.to_a.dup
      codes.delete_at(index)
      self.otp_backup_codes = codes
      save!
      return true
    end
    false
  end

  # Check if 2FA is enabled
  def otp_enabled?
    otp_required_for_login?
  end

  # Provisioning URI for QR code
  def otp_provisioning_uri(email, issuer: 'Avalia Solar Admin')
    return nil unless otp_secret.present?

    ROTP::TOTP.new(otp_secret, issuer: issuer).provisioning_uri(email)
  end

  validate :avatar_photo_type, if: -> { avatar_photo.attached? }
  validate :avatar_photo_size, if: -> { avatar_photo.attached? }

  private

  def avatar_photo_type
    allowed = %w[image/jpeg image/png image/webp]
    errors.add(:avatar_photo, 'deve ser JPG, PNG ou WebP') unless avatar_photo.blob.content_type.in?(allowed)
  end

  def avatar_photo_size
    max_size = 2.megabytes
    errors.add(:avatar_photo, 'deve ter no máximo 2MB') if avatar_photo.blob.byte_size > max_size
  end
end
