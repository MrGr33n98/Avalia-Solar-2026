class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  def self.ransackable_attributes(_auth_object = nil)
    %w[id email created_at updated_at]
  end
end

require_dependency Rails.root.join('app/models/review_decision_service.rb').to_s
