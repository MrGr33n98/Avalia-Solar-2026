class ReviewerPublicationLike < ApplicationRecord
  belongs_to :reviewer_publication, counter_cache: :likes_count
  belongs_to :user, optional: true
  validates :visitor_key, presence: true, unless: :user_id?
  validates :user_id, presence: true, unless: :visitor_key?
end
