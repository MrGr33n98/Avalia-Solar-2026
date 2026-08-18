class Favorite < ApplicationRecord
  ALLOWED_TYPES = %w[Company Product].freeze

  belongs_to :user
  belongs_to :favoritable, polymorphic: true

  validates :favoritable_type, inclusion: { in: ALLOWED_TYPES }
  validates :favoritable_id, uniqueness: { scope: %i[user_id favoritable_type] }
end
