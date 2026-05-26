module Billing
  class PlanSerializer < ActiveModel::Serializer
    attributes :id, :name, :description, :price, :display_order,
               :plan_tier, :feature_flags

    def feature_flags
      object.feature_flags
    end
  end
end
