# frozen_string_literal: true

class KnowledgeArticle < ApplicationRecord
  include PgSearch::Model

  belongs_to :category

  validates :title, presence: true
  validates :content, presence: true
  validates :category, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[draft published] }
  validates :published_at, presence: true, if: -> { status == 'published' }

  before_validation :generate_slug, on: :create

  scope :published, -> { where(status: 'published').where('published_at <= ?', Time.current) }

  pg_search_scope :search_by_text,
                  against: {
                    title: 'A',
                    content: 'B'
                  },
                  using: {
                    tsearch: {
                      dictionary: 'portuguese',
                      prefix: true,
                      any_word: true
                    }
                  }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id title slug content status category_id published_at created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category]
  end

  private

  def generate_slug
    self.slug ||= title.parameterize if title.present?
  end
end
