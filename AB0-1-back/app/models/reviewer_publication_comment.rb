class ReviewerPublicationComment < ApplicationRecord
  include ActionView::Helpers::SanitizeHelper
  belongs_to :reviewer_publication
  belongs_to :user, optional: true
  validates :name, :email, :body, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :body, length: { maximum: 2000 }
  validates :status, inclusion: { in: %w[active hidden] }
  before_validation :sanitize_body

  private

  def sanitize_body
    self.body = sanitize(body.to_s, tags: [], attributes: [])
  end
end
