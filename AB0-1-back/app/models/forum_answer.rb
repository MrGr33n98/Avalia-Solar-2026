class ForumAnswer < ApplicationRecord
  belongs_to :user
  belongs_to :forum_question

  # Add ransackable attributes for ActiveAdmin
  def self.ransackable_attributes(_auth_object = nil)
    %w[answer created_at forum_question_id id requested_at
       status updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[forum_question user]
  end
end
