module Api
  module V1
    class BannerOffersController < BaseController
      def index
        offers = BannerOffer.where(active: true).order(created_at: :desc)
        render json: {
          offers: offers.as_json(only: %i[id name price_cents currency duration_days rules_json active])
        }
      end
    end
  end
end
