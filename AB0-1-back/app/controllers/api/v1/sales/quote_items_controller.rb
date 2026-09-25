module Api
  module V1
    module Sales
      class QuoteItemsController < BaseController
        def create
          quote = current_tenant_scope.quotes.includes(:opportunity).find(params[:quote_id])
          opportunity = current_tenant_scope.opportunities.find(quote.opportunity_id)
          if item_params[:product_id].present?
            company_id = opportunity.account.company_id || opportunity.account.owner&.company_id
            product = ::Sales::Product.find_by(id: item_params[:product_id])
            product_allowed = product.present? && (current_tenant_scope.admin? || product.company_id.nil? || product.company_id == company_id)
            unless product_allowed
              log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Product')
              return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
            end
          end
          item = quote.items.create!(item_params.merge(total_cents: calculated_total))
          quote.update!(total_cents: quote.items.sum(:total_cents))
          render json: { item: serialize(item), quote_total_cents: quote.reload.total_cents }, status: :created
        end

        def destroy
          quote = current_tenant_scope.quotes.includes(:opportunity).find(params[:quote_id])
          current_tenant_scope.opportunities.find(quote.opportunity_id)
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
