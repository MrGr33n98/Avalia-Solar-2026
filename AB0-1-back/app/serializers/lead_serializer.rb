class LeadSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :phone, :message, :created_at, :city, :state, 
             :product_vertical, :project_profile, :wizard_status, 
             :score_band, :cached_score, :estimated_budget
end
