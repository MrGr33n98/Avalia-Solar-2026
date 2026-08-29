class NewsItem < ApplicationRecord
  has_many :feed_items, as: :subject, dependent: :destroy
  belongs_to :actor, polymorphic: true, optional: true
  validates :title, :summary, :source_name, :published_at, presence: true
  validates :reading_time_minutes, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: %w[draft published archived] }

  def publish!(actor:)
    transaction do
      update!(status: 'published', published_at: published_at || Time.current, actor: actor)
      DomainEvent.create!(event_type: 'news_item.published', aggregate_type: self.class.name, aggregate_id: id,
                          payload: { title: title }, occurred_at: Time.current)
    end
  end
end
