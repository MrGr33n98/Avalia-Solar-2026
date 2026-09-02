module Api
  module V1
    module Sales
      class QuoteDocumentsController < BaseController
        def show
          quote = ::Sales::Quote.find(params[:quote_id])
          html = ::Sales::QuoteRenderer.call(quote: quote)
          render html: html.html_safe
        end
      end
    end
  end
end
