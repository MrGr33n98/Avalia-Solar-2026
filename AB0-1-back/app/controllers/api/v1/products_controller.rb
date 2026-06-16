class Api::V1::ProductsController < Api::V1::BaseController
  before_action :set_product, only: %i[show update destroy reviews]

  def index
    include_specs = ActiveModel::Type::Boolean.new.cast(params[:include_specs])
    scope = ::Product
            .includes(:brand, :company, :categories, images_attachments: :blob)
            .where(status: ::Product.statuses[:active])

    scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
    scope = scope.where(brand_id: params[:brand_id]) if params[:brand_id].present?
    scope = scope.where(featured: ActiveModel::Type::Boolean.new.cast(params[:featured])) if params.key?(:featured)
    scope = scope.where('products.price >= ?', params[:price_min].to_d) if params[:price_min].present?
    scope = scope.where('products.price <= ?', params[:price_max].to_d) if params[:price_max].present?

    if params[:q].present?
      q = "%#{params[:q].gsub('%', '\\%').gsub('_', '\\_')}%"
      scope = scope.left_joins(:brand, :company)
                   .where(
                     'products.name ILIKE :q OR products.description ILIKE :q OR brands.name ILIKE :q OR companies.name ILIKE :q',
                     q: q
                   )
    end

    if params[:category_id].present?
      scope = scope.joins(:categories).where(categories: { id: params[:category_id] }).distinct
    end

    scope = case params[:sort]
            when 'price_asc'   then scope.order(price: :asc)
            when 'price_desc'  then scope.order(price: :desc)
            when 'name_asc'    then scope.order(name: :asc)
            when 'rating_desc' then scope.order(created_at: :desc)
            else scope.order(featured: :desc, created_at: :desc)
            end

    page = [params[:page].to_i, 1].max
    requested_per_page = params[:per_page].to_i
    per_page = requested_per_page.positive? ? [requested_per_page, 100].min : 12

    total       = scope.count
    total_pages = (total.to_f / per_page).ceil
    paginated   = scope.limit(per_page).offset((page - 1) * per_page)

    render json: {
      data: paginated.map { |p| p.as_json(include_specs: include_specs) },
      meta: { total: total, page: page, per_page: per_page, total_pages: total_pages }
    }
  rescue StandardError => e
    Rails.logger.error("Products error: #{e.message}")
    track_catalog_error(e, action: 'index')
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

  def reviews
    limit = params[:limit].present? ? params[:limit].to_i : 6
    limit = 6 if limit <= 0

    category_id = params[:category_id].presence || @product.categories.limit(1).pick(:id)
    scope = Review.includes(:company, :user, review_criterion_scores: :rating_criterion)
                  .published
                  .where(company_id: @product.company_id)
                  .order(created_at: :desc)

    scoped_reviews = if category_id.present?
                       category_reviews = scope.where(category_id: category_id)
                       category_reviews.exists? ? category_reviews : scope.where(category_id: nil)
                     else
                       scope
                     end

    reviews = scoped_reviews.limit(limit)
    aggregate = product_review_aggregate(category_id)

    render json: {
      product_id: @product.id,
      company_id: @product.company_id,
      category_id: category_id,
      summary: aggregate,
      reviews: reviews.map { |review| serialize_product_review(review) }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Produto nao encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("[Products#reviews] #{e.message}")
    render json: { error: 'Erro ao carregar avaliacoes do produto' }, status: :internal_server_error
  end

  # GET /api/v1/products/filters
  def filters
    active_products = Product.where(status: Product.statuses[:active])
    templates = SpecTemplate.filterable.order(product_type: :asc, seo_weight: :desc)
    payload = templates.map do |tmpl|
      specs_scope = ProductSpecification
                    .joins(:product)
                    .where(spec_template_id: tmpl.id, products: { status: Product.statuses[:active] })
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

    render json: {
      filters: payload,
      categories: product_categories_payload(active_products),
      companies: product_companies_payload(active_products),
      brands: product_brands_payload(active_products),
      price_range: {
        min: active_products.minimum(:price)&.to_f || 0,
        max: active_products.maximum(:price)&.to_f || 0
      }
    }
  rescue StandardError => e
    Rails.logger.error("[Products#filters] #{e.message}")
    track_catalog_error(e, action: 'filters')
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
      track_product_image_uploaded(@product, source: 'create') if product_image_upload_present?
      render json: @product.as_json(include_specs: true), status: :created
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    previous_status = @product.status
    if @product.update(product_params)
      upsert_specs(@product)
      track_product_update(@product)
      track_product_status_change(@product, previous_status) if previous_status != @product.status
      track_product_image_uploaded(@product, source: 'update') if product_image_upload_present?
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
      :company_id, :sku, :stock, :status, :featured, :brand_id,
      :seo_title, :seo_description, :image, :image_url,
      category_ids: [],
      images: []
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

  def product_categories_payload(active_products)
    Category
      .joins(:products)
      .merge(active_products)
      .select('categories.id, categories.name, categories.seo_url, COUNT(products.id) AS products_count')
      .group('categories.id, categories.name, categories.seo_url')
      .order('categories.name ASC')
      .map do |category|
        {
          id: category.id,
          name: category.name,
          seo_url: category.seo_url,
          slug: category.seo_url,
          products_count: category.read_attribute(:products_count).to_i
        }
      end
  end

  def product_companies_payload(active_products)
    Company
      .joins(:products)
      .merge(active_products)
      .select('companies.id, companies.name, companies.slug, companies.city, companies.state, companies.verified, companies.rating_avg, companies.reviews_count, COUNT(products.id) AS products_count')
      .group('companies.id, companies.name, companies.slug, companies.city, companies.state, companies.verified, companies.rating_avg, companies.reviews_count')
      .order('companies.name ASC')
      .map do |company|
        {
          id: company.id,
          name: company.name,
          slug: company.slug,
          logo_url: company.logo_url,
          city: company.city,
          state: company.state,
          verified: company.verified,
          rating_avg: company.rating_avg&.to_f,
          reviews_count: company.reviews_count,
          products_count: company.read_attribute(:products_count).to_i
        }
      end
  end

  def product_brands_payload(active_products)
    Brand
      .joins(:products)
      .merge(active_products)
      .select('brands.id, brands.name, brands.slug, COUNT(products.id) AS products_count')
      .group('brands.id, brands.name, brands.slug')
      .order('brands.name ASC')
      .map do |brand|
        {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          products_count: brand.read_attribute(:products_count).to_i
        }
      end
  end

  def product_image_upload_present?
    product_payload = params[:product]
    return false unless product_payload.respond_to?(:key?)

    product_payload.key?(:image) || product_payload.key?(:images) ||
      product_payload.key?('image') || product_payload.key?('images')
  end

  def track_product_update(product)
    track_product_event(product, 'product_updated')
  end

  def track_product_status_change(product, previous_status)
    track_product_event(
      product,
      'product_status_changed',
      previous_status: previous_status,
      status: product.status
    )
  end

  def track_product_image_uploaded(product, source:)
    track_product_event(product, 'product_image_uploaded', source: source, image_count: product.images.count)
  end

  def track_catalog_error(error, action:)
    Analytics::PostHogService.capture(
      'product_catalog_api_error',
      {
        source: 'api',
        action: action,
        error_class: error.class.name
      },
      distinct_id: 'products_catalog'
    )
  rescue StandardError => tracking_error
    Rails.logger.warn("[Products#track_catalog_error] #{tracking_error.message}")
  end

  def track_product_event(product, event_type, extra_metadata = {})
    Analytics::TrackEventService.call(
      company_id: product.company_id,
      event_type: event_type,
      metadata: {
        source: 'api',
        product_id: product.id,
        product_name: product.name,
        category_id: product.categories.first&.id,
        category_name: product.categories.first&.name,
        brand_id: product.brand_id,
        brand_name: product.brand&.name,
        company_id: product.company_id,
        company_name: product.company&.name,
        status: product.status,
        featured: product.featured?,
        price_available: product.price.to_f.positive?
      }.merge(extra_metadata)
    )
  rescue StandardError => e
    Rails.logger.warn("[Products#track_product_event] #{event_type}: #{e.message}")
  end

  def product_review_aggregate(category_id)
    return nil unless @product.company.present?

    aggregate_scope = @product.company.review_aggregates
    aggregate =
      if category_id.present?
        aggregate_scope.find_by(category_id: category_id) || aggregate_scope.find_by(category_id: nil)
      else
        aggregate_scope.find_by(category_id: nil)
      end

    return nil unless aggregate

    {
      average_rating: aggregate.average_rating.to_f,
      total_reviews: aggregate.total_reviews,
      scores_distribution: aggregate.scores_distribution || {},
      criteria_breakdown: aggregate.criteria_breakdown || {}
    }
  end

  def serialize_product_review(review)
    {
      id: review.id,
      rating: review.rating.to_f,
      comment: review.comment,
      headline: review.headline,
      pros: review.pros,
      cons: review.cons,
      buyer_tip: review.buyer_tip,
      verified: review.verified,
      featured: review.featured,
      project_type: review.project_type,
      installation_status: review.installation_status,
      estimated_power: review.estimated_power.to_f,
      created_at: review.created_at,
      reply: review.reply,
      replied_at: review.replied_at,
      project_context: review.project_context,
      granular_scores: review.granular_scores_snapshot.presence || serialize_review_scores(review),
      user: {
        id: review.user_id,
        name: review.public_reviewer_name,
        avatar_url: review.user&.avatar_url
      },
      company: {
        id: review.company_id,
        name: review.company&.name,
        slug: review.company&.slug,
        logo_url: review.company&.logo_url
      }
    }
  end

  def serialize_review_scores(review)
    review.review_criterion_scores.map do |score|
      {
        id: score.id,
        score: score.score.to_f,
        not_applicable: score.not_applicable,
        rating_criterion_id: score.rating_criterion_id,
        title: score.title_snapshot || score.rating_criterion&.title,
        weight: score.weight_snapshot || score.rating_criterion&.weight
      }
    end
  end
end
