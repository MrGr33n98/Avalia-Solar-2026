Rails.application.routes.append do
  get '/api/v1/sales/quotes/:quote_id/document', to: 'api/v1/sales/quote_documents#show', as: 'sales_v3_quote_document'
end
