module Api
  module V1
    module Sales
      class QuoteDocumentsController < BaseController
        def show
          quote = current_tenant_scope.quotes.find(params[:quote_id])
          current_tenant_scope.opportunities.find(quote.opportunity_id)
          html = ::Sales::QuoteRenderer.call(quote: quote)
          render html: html.html_safe
        end
      end
    end
  end
end
