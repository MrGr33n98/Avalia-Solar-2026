class Api::V1::ArticlesController < Api::V1::BaseController
  before_action :set_article, only: %i[show update destroy]

  def index
    @articles = Article.all
    render json: @articles
  rescue StandardError => e
    Rails.logger.error("Articles error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @article
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Artigo não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Articles error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @article = Article.new(article_params)

    if @article.save
      render json: @article, status: :created
    else
      render json: { errors: @article.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Articles error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @article.update(article_params)
      render json: @article
    else
      render json: { errors: @article.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Artigo não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Articles error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def destroy
    @article.destroy
    render json: { message: 'Artigo excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Artigo não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Articles error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def set_article
    @article = Article.find(params[:id])
  end

  def article_params
    params.require(:article).permit(:title, :content, :category_id, :product_id)
  end
end
