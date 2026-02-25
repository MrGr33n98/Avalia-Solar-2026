class Api::V1::ProductsController < Api::V1::BaseController
  before_action :set_product, only: %i[show update destroy]

  def index
    include_specs = ActiveModel::Type::Boolean.new.cast(params[:include_specs])
    @products = ::Product.includes(:company, :categories)

    # Filtra por company_id se fornecido
    @products = @products.where(company_id: params[:company_id]) if params[:company_id].present?

    # Adiciona limite se fornecido
    @products = @products.limit(params[:limit].to_i) if params[:limit].present?

    render json: @products.map { |p| p.as_json(include_specs: include_specs) }
  rescue StandardError => e
    Rails.logger.error("Products error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @product.as_json(include_specs: true)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Produto nao encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Products error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  # GET /api/v1/products/filters
  def filters
    templates = SpecTemplate.filterable.order(product_type: :asc, seo_weight: :desc)
    payload = templates.map do |tmpl|
      specs_scope = ProductSpecification.where(spec_template_id: tmpl.id)
      values =
        case tmpl.value_type
        when 'enum', 'string'
          specs_scope.where.not(value_string: [nil, '']).distinct.limit(50).pluck(:value_string)
        when 'boolean'
          [true, false].select { |v| specs_scope.where(value_boolean: v).exists? }
        when 'decimal', 'integer'
          { min: specs_scope.minimum(:value_number), max: specs_scope.maximum(:value_number) }
        when 'range', 'json'
          nil
        end

      {
        key: tmpl.key,
        label: tmpl.label,
        type: tmpl.value_type,
        unit: tmpl.unit,
        product_type: tmpl.product_type,
        seo_weight: tmpl.seo_weight,
        options: values
      }
    end

    render json: { filters: payload }
  rescue StandardError => e
    Rails.logger.error("[Products#filters] #{e.message}")
    render json: { error: 'Erro ao carregar filtros' }, status: :internal_server_error
  end

  # GET /api/v1/products/compare?ids[]=1&ids[]=2
  def compare
    ids = Array(params[:ids]).map(&:to_i).uniq
    return render json: { error: 'ids obrigatorios' }, status: :bad_request if ids.empty?

    products = Product.includes(product_specifications: :spec_template, categories: [], company: []).where(id: ids)
    comparable_templates = SpecTemplate.comparable

    comparisons = comparable_templates.map do |tmpl|
      {
        key: tmpl.key,
        label: tmpl.label,
        unit: tmpl.unit,
        type: tmpl.value_type,
        values: products.map do |product|
          spec = product.product_specifications.detect { |ps| ps.spec_template_id == tmpl.id }
          { product_id: product.id, value: spec&.value }
        end
      }
    end

    render json: {
      products: products.map { |p| p.as_json(include_specs: true) },
      comparisons: comparisons
    }
  rescue StandardError => e
    Rails.logger.error("[Products#compare] #{e.message}")
    render json: { error: 'Erro ao comparar produtos' }, status: :internal_server_error
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
      upsert_specs(@product)
      render json: @product.as_json(include_specs: true), status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @product.update(product_params)
      upsert_specs(@product)
      render json: @product.as_json(include_specs: true)
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @product.destroy
    render json: { message: 'Produto excluido' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Produto nao encontrado' }, status: :not_found
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

  def upsert_specs(product)
    payload = specs_payload
    return if payload.blank?

    ProductSpecifications::UpsertService.call(product: product, specs_payload: payload)
  rescue StandardError => e
    Rails.logger.error("[Products#upsert_specs] #{e.message}")
  end

  def specs_payload
    permitted = params.permit(specifications: [:key, :value, :value_number, :value_boolean, { value_json: {} }])
    permitted[:specifications] || []
  end
end
