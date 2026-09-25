module Api
  module V1
    module Sales
      class QuotesController < BaseController
        def index
          scope = current_tenant_scope.quotes.includes(:items).order(created_at: :desc)
          scope = scope.where(opportunity_id: params[:opportunity_id]) if params[:opportunity_id].present?
          render json: { quotes: scope.map { |quote| serialize(quote) } }
        end

        def create
          opportunity = current_tenant_scope.opportunities.find(quote_params[:opportunity_id])
          if quote_params[:solar_project_id].present?
            project = ::Sales::SolarProject.find_by(id: quote_params[:solar_project_id])
            unless project && current_tenant_scope.accounts.exists?(id: project.account_id)
              log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'SolarProject')
              return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
            end
            return render_relation_conflict(resource: 'Quote') unless project.account_id == opportunity.sales_account_id &&
              (project.opportunity_id.blank? || project.opportunity_id == opportunity.id)
          end

          quote = ::Sales::Quote.create!(quote_params.merge(opportunity: opportunity, created_by: current_user))
          render json: { quote: serialize(quote) }, status: :created
        end

        def update
          quote = current_tenant_scope.quotes.find(params[:id])
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
