module Api
  module V1
    module Sales
      class QuoteItemsController < BaseController
        def create
          quote = ::Sales::Quote.find(params[:quote_id])
          item = quote.items.create!(item_params.merge(total_cents: calculated_total))
          quote.update!(total_cents: quote.items.sum(:total_cents))
          render json: { item: serialize(item), quote_total_cents: quote.reload.total_cents }, status: :created
        end

        def destroy
          quote = ::Sales::Quote.find(params[:quote_id])
          quote.items.find(params[:id]).destroy!
          quote.update!(total_cents: quote.items.sum(:total_cents))
          head :no_content
        end

        private

        def item_params
          params.require(:item).permit(:product_id, :description, :quantity, :unit_price_cents)
        end

        def calculated_total
          (item_params[:quantity].to_d * item_params[:unit_price_cents].to_i).round
        end

        def serialize(item)
          { id: item.id, product_id: item.product_id, description: item.description,
            quantity: item.quantity, unit_price_cents: item.unit_price_cents, total_cents: item.total_cents }
        end
      end
    end
  end
end
