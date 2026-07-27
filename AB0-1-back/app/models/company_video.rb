class CompanyVideo < ApplicationRecord
  belongs_to :company

  enum status: {
    pending: 'pending',
    published: 'published'
  }, _suffix: true

  validates :url, presence: true
  validates :provider, inclusion: { in: %w[youtube] }
  validates :video_id, presence: true
  validates :video_id, uniqueness: { scope: %i[company_id provider] }
end
