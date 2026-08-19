class ReviewerPublication < ApplicationRecord
  belongs_to :user
  has_many :reviewer_publication_comments, dependent: :destroy
  has_many :reviewer_publication_likes, dependent: :destroy
  has_one_attached :cover_image
  has_many_attached :attachments

  STATUSES = %w[draft published archived].freeze
  TYPES = %w[article case_study tip project].freeze

  validates :title, presence: true, length: { maximum: 120 }
  validates :excerpt, length: { maximum: 500 }, allow_blank: true
  validates :body, presence: true, length: { maximum: 100_000 }
  validates :slug, presence: true, uniqueness: { scope: :user_id }, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :status, inclusion: { in: STATUSES }
  validates :publication_type, inclusion: { in: TYPES }
  scope :published, -> { where(status: 'published').where.not(published_at: nil) }
  after_commit :invalidate_creator_cache

  def publish!
    transaction do
      update!(status: 'published', published_at: Time.current)
      DomainEvent.create!(
        event_type: 'publication.published',
        aggregate_type: self.class.name,
        aggregate_id: id,
        payload: { user_id: user_id, title: title, slug: slug },
        occurred_at: Time.current
      )
    end
  end

  def archive!
    update!(status: 'archived')
  end

  def restore_to_draft!
    update!(status: 'draft', published_at: nil)
  end

  private

  def invalidate_creator_cache
    Creator::PublicProfileService.invalidate_for_user(user)
  end
end
