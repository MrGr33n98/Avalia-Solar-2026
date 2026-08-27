# frozen_string_literal: true

class CreatorTreeSetting < ApplicationRecord
  belongs_to :reviewer, class_name: 'ReviewerProfile'
  has_one_attached :background_image

  validates :theme_key, presence: true
  validates :reviewer_id, uniqueness: true
end
