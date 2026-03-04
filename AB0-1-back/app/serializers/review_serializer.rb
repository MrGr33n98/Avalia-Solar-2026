class ReviewSerializer < ActiveModel::Serializer
  attributes :id, :rating, :comment, :user_id, :company_id, :created_at, :updated_at,
             :reply, :replied_at, :status, :featured, :display_order, :verified

  belongs_to :user
  belongs_to :company
  has_many :review_criterion_scores
end
