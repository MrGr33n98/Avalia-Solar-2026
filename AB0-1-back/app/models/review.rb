class Review < ApplicationRecord
  include ReviewCallbacks

  belongs_to :company, counter_cache: :rating_count
  belongs_to :user

  enum status: { pending: 0, approved: 1, rejected: 2 }

  after_commit :track_analytics_event, on: :create

  validates :rating, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validates :comment, presence: true, length: { minimum: 10 }

  # Update ransackable attributes to include comment
  def self.ransackable_attributes(_auth_object = nil)
    %w[comment created_at id company_id rating updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company user]
  end

  private

  def track_analytics_event
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'review_created',
      metadata: {
        source: 'review',
        rating: rating
      },
      user: nil,
      tracked_at: created_at
    )
  rescue StandardError => e
    Rails.logger.warn("[Analytics] review tracking failed: #{e.message}")
  end
end
