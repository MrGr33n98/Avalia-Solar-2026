module Api
  module V1
    module CompanyAdmin
      class FinancingOffersController < BaseController
        before_action :set_offer, only: %i[update destroy]

        def index
          offers = policy_scope(@company.company_financing_offers).ordered
          render json: { offers: offers.map { |offer| serialize_offer(offer) } }
        end

        def create
          offer = @company.company_financing_offers.new(offer_params)
          authorize offer
          offer.position ||= (@company.company_financing_offers.maximum(:position) || -1) + 1

          if offer.save
            render json: { offer: serialize_offer(offer) }, status: :created
          else
            render json: { errors: offer.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          authorize @offer
          if @offer.update(offer_params)
            render json: { offer: serialize_offer(@offer) }
          else
            render json: { errors: @offer.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @offer
          @offer.destroy
          head :no_content
        end

        def reorder
          offers = policy_scope(@company.company_financing_offers)
          ids = Array(params[:offer_ids] || params[:ids])
          ids.each_with_index do |id, index|
            offer = offers.find_by(id: id)
            offer&.update(position: index)
          end

          render json: { offers: offers.ordered.map { |offer| serialize_offer(offer) } }
        end

        private

        def set_offer
          @offer = @company.company_financing_offers.find(params[:id])
        end

        def offer_params
          params.require(:financing_offer).permit(
            :name, :offer_type, :term_months, :interest_rate_monthly,
            :min_down_payment_percent, :grace_months, :amortization_type,
            :notes, :active, :position
          )
        end

        def serialize_offer(offer)
          offer.as_json(
            only: %i[
              id name offer_type term_months interest_rate_monthly
              min_down_payment_percent grace_months amortization_type
              notes active position
            ]
          )
        end
      end
    end
  end
end
