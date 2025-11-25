class Api::V1::ArticlesController < Api::V1::BaseController
  include Cacheable # TASK-015: Enable caching
  include Paginatable # TASK-017: Enable pagination
  
  before_action :set_article, only: %i[show update destroy]
  after_action :expire_articles_cache, only: %i[create update destroy]

  def index
    cache_key = cache_key_for('articles', params.except(:page, :per_page))
    
    cached_json(cache_key, expires_in: 15.minutes) do
      scope = Article.includes(:category, :company, :product).order(created_at: :desc)
      scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
      scope = scope.where(category_id: params[:category_id]) if params[:category_id].present?
      scope = scope.where(product_id: params[:product_id]) if params[:product_id].present?
      scope = scope.where(sponsored: true) if boolean_param(:sponsored)
      
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
    cache_key = "articles/show/#{@article.id}/#{@article.updated_at.to_i}"
    
    cached_json(cache_key, expires_in: 1.hour) do
      ArticleSerializer.new(@article).as_json
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Artigo não encontrado' }, status: :not_found
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
    @article = Article.find(params[:id])
  end

  def article_params
    params.require(:article).permit(:title, :content, :category_id, :product_id, :company_id, :sponsored, :sponsored_label)
  end

  def boolean_param(name)
    return false unless params.key?(name)
    ActiveModel::Type::Boolean.new.cast(params[name])
  end

  # Expire article caches when data changes
  def expire_articles_cache
    expire_cache('articles')
    # Also expire category cache if article has category
    expire_cache("categories/show/#{@article.category_id}") if @article.category_id
    Rails.logger.info("🗑️  Expired article caches")
  end
end
