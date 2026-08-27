# frozen_string_literal: true

class CreatorTreeSetting < ApplicationRecord
  belongs_to :reviewer, class_name: 'ReviewerProfile'

  validates :theme_key, presence: true
  validates :reviewer_id, uniqueness: true
end
