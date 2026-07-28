module Api
  module V1
    module Dashboard
      class ProductsController < BaseController
        before_action :set_product, only: %i[update destroy]

        def index
          products = filtered_products
          paginated = paginate(products)
          set_pagination_headers(paginated)

          render json: {
            data: paginated.map { |product| product_payload(product) },
            meta: {
              pagination: pagination_metadata(paginated),
              stats: catalog_stats
            }
          }
        end

        def create
          product = current_company.products.new(product_params)
          product.status = 'draft' if product.status.blank?

          if product.save
            render json: { product: product_payload(product) }, status: :created
          else
            render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @product.update(product_params)
            render json: { product: product_payload(@product) }
          else
            render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # Arquivamento é reversível e preserva a integridade de cotações,
        # avaliações e histórico de preço já vinculados ao produto.
        def destroy
          @product.update!(status: 'archived')
          head :no_content
        end

        private

        def set_product
          @product = current_company.products.find(params[:id])
        end

        def filtered_products
          scope = current_company.products
                                 .includes(:brand, :categories, :product_specifications, images_attachments: :blob)
                                 .order(updated_at: :desc)

          scope = scope.where(status: params[:status]) if params[:status].in?(Product.statuses.keys)
          scope = scope.joins(:categories).where(categories: { id: params[:category_id] }).distinct if params[:category_id].present?
          scope = scope.where(brand_id: params[:brand_id]) if params[:brand_id].present?

          if params[:q].present?
            term = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].to_s)}%"
            scope = scope.where('products.name ILIKE :term OR products.sku ILIKE :term OR products.description ILIKE :term', term: term)
          end

          case params[:media]
          when 'with_images'
            scope = scope.joins(:images_attachments).distinct
          when 'without_images'
            scope = scope.left_joins(:images_attachments)
                         .where('active_storage_attachments.id IS NULL AND (products.image_url IS NULL OR products.image_url = \'\')')
          end

          case params[:stock]
          when 'available'
            scope = scope.where('products.stock > 0')
          when 'unavailable'
            scope = scope.where('products.stock IS NULL OR products.stock <= 0')
          end

          scope
        end

        def catalog_stats
          products = current_company.products.includes(images_attachments: :blob, :product_specifications)
          product_list = products.to_a

          {
            total: product_list.size,
            published: product_list.count(&:active_status?),
            drafts: product_list.count(&:draft_status?),
            archived: product_list.count(&:archived_status?),
            disabled: product_list.count(&:disabled_status?),
            without_images: product_list.count { |product| product.image_urls.blank? },
            without_specifications: product_list.count { |product| product.product_specifications.empty? },
            without_price: product_list.count { |product| product.price.blank? || product.price <= 0 },
            unavailable_stock: product_list.count { |product| product.stock.blank? || product.stock <= 0 }
          }
        end

        def product_params
          params.require(:product).permit(
            :name, :description, :short_description, :price, :sku, :stock,
            :status, :featured, :seo_title, :seo_description, :brand_id, :image_url,
            category_ids: [], images: []
          )
        end

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
            brand_id: product.brand_id,
            brand_slug: product.brand&.slug,
            brand: product.brand && { id: product.brand.id, name: product.brand.name, slug: product.brand.slug },
            categories: product.categories.map { |category| { id: category.id, name: category.name, seo_url: category.seo_url } },
            image_url: product.image_url,
            image_urls: product.image_urls,
            images_count: product.image_urls.size,
            specifications_count: product.product_specifications.size,
            completeness: completeness_for(product),
            created_at: product.created_at,
            updated_at: product.updated_at
          }
        end

        def completeness_for(product)
          fields = [
            product.name.present?, product.sku.present?, product.description.present?,
            product.price.present? && product.price.positive?, product.categories.any?,
            product.image_urls.present?, product.stock.present?
          ]
          ((fields.count(true).to_f / fields.length) * 100).round
        end
      end
    end
  end
end
