class AdminUser < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable
         
  # Notifications association
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: 'Noticed::Notification'
end
