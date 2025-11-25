class ReviewSerializer < ActiveModel::Serializer
  attributes :id, :rating, :comment, :user_id, :product_id, :created_at, :updated_at

  belongs_to :user
  belongs_to :product
end
