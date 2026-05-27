module Billing
  class PlanSerializer < ActiveModel::Serializer
    attributes :id, :name, :description, :price, :display_order,
               :slug, :plan_tier, :price_cents, :price_formatted, :price_label,
               :stripe_product_id, :stripe_price_id_monthly, :stripe_price_id_yearly,
               :features, :feature_flags, :highlights, :audience, :summary, :badge,
               :featured

    def feature_flags
      object.feature_flags
    end

    def features
      object.feature_flags
    end

    def slug
      object.inferred_plan_tier.presence || object.plan_tier.presence || infer_slug_from_name
    end

    def plan_tier
      slug
    end

    def price_cents
      ((object.price || 0).to_d * 100).to_i
    end

    def price_formatted
      return 'R$ 0' if price_cents.zero? && slug == 'free'
      return 'Customizado' if slug == 'enterprise'
      return 'Sob proposta comercial' if price_cents.zero?

      ActionController::Base.helpers.number_to_currency(object.price, unit: 'R$ ', separator: ',', delimiter: '.')
    end

    def price_label
      price_formatted
    end

    def highlights
      []
    end

    def audience
      ''
    end

    def summary
      object.description.to_s
    end

    def badge
      nil
    end

    def featured
      slug == 'pro'
    end

    private

    def infer_slug_from_name
      normalized_name = object.name.to_s.downcase
      return 'enterprise' if normalized_name.include?('enterprise')
      return 'pro' if normalized_name.match?(/pro|starter|premium|pago/)

      'free'
    end
  end
end
