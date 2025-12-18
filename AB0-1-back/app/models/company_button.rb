class CompanyButton < ApplicationRecord
  belongs_to :company, touch: true
  
  validates :label, presence: true
  validates :url, presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: 'must be a valid URL' }
  validates :button_type, inclusion: { in: %w[primary secondary whatsapp custom], message: "%{value} is not a valid button type" }
  
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(position: :asc) }
end
