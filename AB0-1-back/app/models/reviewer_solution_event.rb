class ReviewerSolutionEvent < ApplicationRecord
  belongs_to :reviewer_solution
  belongs_to :actor, class_name: 'User', optional: true
  validates :action, presence: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[id reviewer_solution_id actor_id action old_status new_status created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[reviewer_solution actor]
  end
end
