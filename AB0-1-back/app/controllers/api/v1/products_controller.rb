class Api::V1::ProductsController < Api::V1::BaseController
  before_action :set_product, only: %i[show update destroy]

  def index
    @products = Product.includes(:company, :categories)

    # Filtra por company_id se fornecido
    @products = @products.where(company_id: params[:company_id]) if params[:company_id].present?

    # Adiciona limite se fornecido
    @products = @products.limit(params[:limit].to_i) if params[:limit].present?

    render json: @products, include: {
      company: { only: %i[id name] },
      categories: { only: %i[id name] }
    }
  rescue StandardError => e
    Rails.logger.error("Products error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @product
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Produto não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Products error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @product = Product.new(product_params)
    if @product.company_id.present?
      company = Company.find_by(id: @product.company_id)
      if company
        limit = company.max_products_limit
        if limit && company.products.count >= limit
          return render json: { error: 'Limite de produtos do plano atingido' }, status: :forbidden
        end
      end
    end

    if @product.save
      render json: @product, status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @product.update(product_params)
      render json: @product
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @product.destroy
    render json: { message: 'Produto excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Produto não encontrado' }, status: :not_found
  end

  private

  def set_product
    @product = Product.find(params[:id])
  end

  def product_params
    params.require(:product).permit(
      :name, :description, :short_description, :price,
      :company_id, :sku, :stock, :status, :featured,
      :seo_title, :seo_description, :image, :image_url,
      category_ids: []
    )
  end
end
