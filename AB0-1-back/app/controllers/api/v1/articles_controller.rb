class Api::V1::ArticlesController < Api::V1::BaseController
  include Cacheable # TASK-015: Enable caching
  include Paginatable # TASK-017: Enable pagination

  before_action :set_article, only: %i[show update destroy]
  after_action :expire_articles_cache, only: %i[create update destroy]

  def index
    cache_key = cache_key_for('articles', params.except(:page, :per_page))
    cache_key = "#{cache_key}/#{Digest::MD5.hexdigest({ page: params[:page], per_page: params[:per_page],
                                                        q: params[:q], sort: params[:sort] }.to_json)}"

    cached_json(cache_key, expires_in: 15.minutes) do
      scope = Article.includes(:category, :companies, :author).with_attached_banner
      scope = scope.published
      category_param = params[:category_id].presence || params[:category].presence
      if category_param.present?
        category = if category_param.to_s.match?(/\A\d+\z/)
                     Category.find_by(id: category_param)
                   else
                     Category.find_by(seo_url: category_param) || Category.find_by(slug: category_param)
                   end
        scope = category ? scope.where(category_id: category.id) : scope.none
      end
      scope = scope.featured if boolean_param(:featured)

      scope = scope.joins(:companies).where(companies: { id: params[:company_id] }) if params[:company_id].present?

      scope = apply_search(scope)
      scope = apply_sort(scope)

      paginated = paginate(scope)
      set_pagination_headers(paginated)

      {
        data: ActiveModelSerializers::SerializableResource.new(
          paginated,
          each_serializer: ArticleSerializer
        ).as_json,
        meta: { pagination: pagination_metadata(paginated) }
      }
    end
  rescue StandardError => e
    Rails.logger.error("Articles#index error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    # Increment view count (async ideally, but simple here)
    @article.increment!(:views_count)

    # Track article view event
    Analytics::TrackEventService.call(
      event_type: 'article_view',
      company_id: nil,
      user: current_user,
      metadata: request_metadata.merge(
        article_id: @article.id,
        article_title: @article.title,
        category_id: @article.category_id
      )
    )

    cache_key = "articles/show/#{@article.id}/#{@article.updated_at.to_i}"

    cached_json(cache_key, expires_in: 1.hour) do
      ArticleSerializer.new(@article).as_json
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Artigo não encontrado' }, status: :not_found
  end

  def related
    @article = begin
      Article.friendly.find(params[:id])
    rescue StandardError
      Article.find(params[:id])
    end

    # Simple related logic: same category, excluding self
    related_scope = Article.published
                           .where(category_id: @article.category_id)
                           .where.not(id: @article.id)
                           .limit(3)

    render json: related_scope, each_serializer: ArticleSerializer
  end

  def featured
    limit = params[:limit].to_i
    limit = 3 if limit <= 0
    limit = [limit, 12].min

    scope = Article.includes(:category, :companies, :author)
                   .with_attached_banner
                   .published
                   .featured
                   .order(published_at: :desc)
                   .limit(limit)

    if scope.empty?
      scope = Article.includes(:category, :companies, :author)
                     .with_attached_banner
                     .published
                     .order(published_at: :desc)
                     .limit(limit)
    end

    render json: scope, each_serializer: ArticleSerializer
  end

  def create
    @article = Article.new(article_params)
    if @article.save
      render json: @article, serializer: ArticleSerializer, status: :created
    else
      render json: { errors: @article.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Articles#create error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @article.update(article_params)
      render json: @article, serializer: ArticleSerializer
    else
      render json: { errors: @article.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Articles#update error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def destroy
    @article.destroy
    head :no_content
  rescue StandardError => e
    Rails.logger.error("Articles#destroy error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def set_article
    # Supports both numeric IDs and friendly slugs
    @article = Article.with_attached_banner.includes(:category, :companies, :author).friendly.find(params[:id])
  end

  def article_params
    permitted = %i[
      title slug content excerpt seo_title seo_description meta_title meta_description seo_keywords published_at
      status featured category_id author_id banner
      product_id sponsored sponsored_label views_count
    ]
    permitted << :company_id if Article.column_names.include?('company_id')

    params.require(:article).permit(*permitted, company_ids: [])
  end

  def boolean_param(name)
    return false unless params.key?(name)

    ActiveModel::Type::Boolean.new.cast(params[name])
  end

  def apply_search(scope)
    return scope unless params[:q].present?

    term = params[:q].to_s.strip
    return scope if term.blank?

    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    if adapter.include?('sqlite')
      q_lower = term.downcase
      scope.where(
        'LOWER(title) LIKE :q OR LOWER(content) LIKE :q OR LOWER(excerpt) LIKE :q',
        q: "%#{q_lower}%"
      )
    else
      scope.where(
        'title ILIKE :q OR content ILIKE :q OR excerpt ILIKE :q',
        q: "%#{term}%"
      )
    end
  end

  def apply_sort(scope)
    case params[:sort].to_s
    when 'popular'
      scope.order(views_count: :desc, published_at: :desc, created_at: :desc)
    when 'oldest'
      scope.order(published_at: :asc, created_at: :asc)
    else # latest
      scope.order(published_at: :desc, created_at: :desc)
    end
  end

  # Expire article caches when data changes
  def expire_articles_cache
    expire_cache('articles')
    # Also expire category cache if article has category
    expire_cache("categories/show/#{@article.category_id}") if @article.category_id
    Rails.logger.info('🗑️  Expired article caches')
  end
end
