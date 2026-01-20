# frozen_string_literal: true

class Faq < ApplicationRecord
  validates :question, :answer, :category, presence: true

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(position: :asc, created_at: :desc) }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :search, lambda { |query|
    return all if query.blank?
    where('question ILIKE :q OR answer ILIKE :q OR category ILIKE :q', q: "%#{query}%")
  }

  def helpful_total
    helpful_yes.to_i + helpful_no.to_i
  end
end
