class BannerEvent < ApplicationRecord
  belongs_to :banner
  belongs_to :company, optional: true

  EVENT_TYPES = %w[view impression click lead].freeze
  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :tracked_at, presence: true

  scope :views, -> { where(event_type: %w[view impression]) }
  scope :clicks, -> { where(event_type: 'click') }
  scope :leads, -> { where(event_type: 'lead') }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id banner_id company_id event_type tracked_at created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[banner company]
  end
end
