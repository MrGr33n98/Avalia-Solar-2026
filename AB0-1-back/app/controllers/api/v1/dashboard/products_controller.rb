module Api
  module V1
    module Dashboard
      class ProductsController < BaseController
        def index
          products = current_company.products.order(created_at: :desc)
          paginated = paginate(products)
          set_pagination_headers(paginated)

          render json: {
            data: paginated.map { |product| product_payload(product) },
            meta: { pagination: pagination_metadata(paginated) }
          }
        end

        private

        def product_payload(product)
          {
            id: product.id,
            name: product.name,
            description: product.description,
            short_description: product.short_description,
            price: product.price.to_f,
            featured: product.featured,
            status: product.status,
            sku: product.sku,
            stock: product.stock,
            category_ids: product.category_ids,
            created_at: product.created_at
          }
        end
      end
    end
  end
end
