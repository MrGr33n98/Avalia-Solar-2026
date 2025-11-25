class ReviewSerializer < ActiveModel::Serializer
  attributes :id, :rating, :comment, :user_id, :company_id, :created_at, :updated_at

  belongs_to :user
  belongs_to :company
end
