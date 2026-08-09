module Api
  module V1
    class BannerAddonsController < Api::V1::BaseController
      before_action :authenticate_api_user

      def index
        addons = BannerAddon.where(active: true).order(priority_boost: :desc, price_cents: :asc)
        
        render json: {
          banner_addons: addons.map do |addon|
            {
              id: addon.id,
              name: addon.name,
              code: addon.code,
              description: addon.description,
              category: addon.category,
              price_cents: addon.price_cents,
              promotional_price_cents: addon.promo_price_cents,
              currency: addon.currency,
              duration_days: addon.duration_days,
              benefits: addon.benefits,
              stackable: addon.stackable
            }
          end
        }
      end
    end
  end
end
