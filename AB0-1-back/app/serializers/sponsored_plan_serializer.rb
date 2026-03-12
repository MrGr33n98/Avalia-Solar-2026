class SponsoredPlanSerializer < ActiveModel::Serializer
  attributes :id,
             :member_id,
             :product_id,
             :category_id,
             :plan_id,
             :custom_cta,
             :active,
             :purchased_at,
             :start_at,
             :end_at
end
