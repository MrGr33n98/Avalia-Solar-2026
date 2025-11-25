class ForumQuestionSerializer < ActiveModel::Serializer
  attributes :id, :subject, :description, :status, :requested_at,
             :user_id, :company_id, :product_id, :category_id,
             :created_at, :updated_at

  belongs_to :user
  belongs_to :company, if: -> { object.company_id.present? }
  belongs_to :product, if: -> { object.product_id.present? }
  belongs_to :category
end
