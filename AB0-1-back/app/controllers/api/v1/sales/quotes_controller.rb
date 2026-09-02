module Api
  module V1
    module Sales
      class QuotesController < BaseController
        def index
          quotes = ::Sales::Quote.includes(:items).where(opportunity_id: params[:opportunity_id]).order(created_at: :desc)
          render json: { quotes: quotes.map { |quote| serialize(quote) } }
        end

        def create
          quote = ::Sales::Quote.create!(quote_params.merge(created_by: current_user))
          render json: { quote: serialize(quote) }, status: :created
        end

        def update
          quote = ::Sales::Quote.find(params[:id])
          ::Sales::QuoteLifecycle.call(quote: quote, to: params.require(:quote).require(:status), actor: current_user)
          render json: { quote: serialize(quote.reload) }
        end

        private

        def quote_params
          params.require(:quote).permit(:opportunity_id, :solar_project_id, :number, :expires_on, :total_cents, :currency)
        end

        def serialize(quote)
          { id: quote.id, opportunity_id: quote.opportunity_id, number: quote.number, status: quote.status,
            expires_on: quote.expires_on, total_cents: quote.total_cents, currency: quote.currency,
            items: quote.items.map { |item| { id: item.id, description: item.description, quantity: item.quantity, total_cents: item.total_cents } } }
        end
      end
    end
  end
end
