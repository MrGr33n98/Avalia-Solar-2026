class Poll < ApplicationRecord
  has_many :feed_items, as: :subject, dependent: :destroy
  has_many :poll_options, dependent: :destroy
  has_many :poll_votes, dependent: :destroy
  accepts_nested_attributes_for :poll_options, reject_if: :all_blank
  belongs_to :actor, polymorphic: true, optional: true
  validates :question, presence: true
  validates :status, inclusion: { in: %w[draft published closed] }
  validate :requires_two_options_when_published

  private

  def requires_two_options_when_published
    errors.add(:poll_options, 'deve possuir pelo menos duas opções') if published? && poll_options.reject(&:marked_for_destruction?).size < 2
  end

  def publish!(actor:)
    transaction do
      update!(status: 'published', actor: actor)
      DomainEvent.create!(event_type: 'poll.published', aggregate_type: self.class.name, aggregate_id: id,
                          payload: { question: question }, occurred_at: Time.current)
    end
  end
end
