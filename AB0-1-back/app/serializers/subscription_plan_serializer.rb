class SubscriptionPlanSerializer < ActiveModel::Serializer
  attributes :id,
             :member_id,
             :product_id,
             :category_id,
             :plan_id,
             :value,
             :effective_value,
             :status,
             :status_label,
             :purchased_at,
             :start_at,
             :end_at,
             :active

  def active
    object.active_on?
  end
end
