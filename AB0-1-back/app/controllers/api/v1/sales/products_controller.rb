module Api
  module V1
    module Sales
      class ProductsController < BaseController
        def index
          products = ::Sales::Product.where(active: true).order(:name)
          render json: { products: products.map { |p| serialize(p) } }
        end

        def create
          product = ::Sales::Product.create!(product_params)
          render json: { product: serialize(product) }, status: :created
        end

        private

        def product_params
          params.require(:product).permit(:company_id, :sku, :name, :description, :unit_price_cents, :currency, :active)
        end

        def serialize(product)
          { id: product.id, sku: product.sku, name: product.name, description: product.description,
            unit_price_cents: product.unit_price_cents, currency: product.currency, active: product.active }
        end
      end
    end
  end
end
