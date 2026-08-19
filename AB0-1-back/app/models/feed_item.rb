# frozen_string_literal: true

class FeedItem < ApplicationRecord
  belongs_to :actor, polymorphic: true
  belongs_to :subject, polymorphic: true

  validates :verb, presence: true
  validates :visibility, presence: true, inclusion: { in: %w[public authenticated followers group private] }
  validates :published_at, presence: true

  scope :public_items, -> { where(visibility: 'public') }
  scope :recent, -> { order(published_at: :desc, id: :desc) }
end
