class AdminUser < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable
         
  # Notifications association
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: 'Noticed::Notification'

  has_one_attached :avatar_photo

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
