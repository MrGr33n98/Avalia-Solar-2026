class Downloadable < ApplicationRecord
  def self.ransackable_attributes(_auth_object = nil)
    %w[id title article_id created_at]
  end
end
