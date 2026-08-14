class ReviewerPublication < ApplicationRecord
  belongs_to :user
  has_many :reviewer_publication_comments, dependent: :destroy
  has_one_attached :cover_image
  has_many_attached :attachments

  STATUSES = %w[draft published archived].freeze
  TYPES = %w[article case_study tip project].freeze

  validates :title, :body, :slug, presence: true
  validates :slug, uniqueness: { scope: :user_id }, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :status, inclusion: { in: STATUSES }
  validates :publication_type, inclusion: { in: TYPES }
  scope :published, -> { where(status: 'published').where.not(published_at: nil) }
  after_commit :invalidate_creator_cache

  private

  def invalidate_creator_cache
    Creator::PublicProfileService.invalidate_for_user(user)
  end
end
