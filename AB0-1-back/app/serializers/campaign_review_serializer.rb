class CampaignReviewSerializer < ActiveModel::Serializer
  attributes :id, :title, :code, :member_id, :share_code, :goal, :achieved,
             :debutants, :shares, :prize, :start_at, :end_at,
             :company_id, :product_id, :sponsored, :created_at, :updated_at

  belongs_to :company, if: -> { object.company_id.present? }
  belongs_to :product, if: -> { object.product_id.present? }
end
