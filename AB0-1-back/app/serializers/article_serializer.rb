class ArticleSerializer < ActiveModel::Serializer
  attributes :id, :title, :content, :category_id, :company_id, :product_id,
             :sponsored, :sponsored_label, :created_at, :updated_at

  belongs_to :category
  belongs_to :company, if: -> { object.company_id.present? }
  belongs_to :product, if: -> { object.product_id.present? }
end
