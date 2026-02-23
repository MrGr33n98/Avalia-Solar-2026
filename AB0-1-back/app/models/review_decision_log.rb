class ReviewDecisionLog < ApplicationRecord
  belongs_to :review
  belongs_to :admin_user

  enum action: { approved: 'approved', rejected: 'rejected', reviewed: 'reviewed' }, _prefix: :action

  validates :action, presence: true
  validates :new_status, presence: true
end
