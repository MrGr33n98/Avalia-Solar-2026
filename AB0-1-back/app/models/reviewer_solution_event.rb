class ReviewerSolutionEvent < ApplicationRecord
  belongs_to :reviewer_solution
  belongs_to :actor, class_name: 'User', optional: true
  validates :action, presence: true
end
