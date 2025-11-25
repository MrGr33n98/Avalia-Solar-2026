class Api::V1::ForumQuestionsController < Api::V1::BaseController
  before_action :set_forum_question, only: %i[show update destroy]

  def index
    scope = ForumQuestion.includes(:category, :company, :product, :user).order(created_at: :desc)
    scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
    scope = scope.where(product_id: params[:product_id]) if params[:product_id].present?
    scope = scope.where(category_id: params[:category_id]) if params[:category_id].present?
    render json: scope, each_serializer: ForumQuestionSerializer
  rescue StandardError => e
    Rails.logger.error("ForumQuestions#index error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  def show
    render json: @forum_question, serializer: ForumQuestionSerializer
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Registro não encontrado' }, status: :not_found
  end

  def create
    fq = ForumQuestion.new(fq_params)
    if fq.save
      render json: fq, status: :created
    else
      render json: { errors: fq.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("ForumQuestions#create error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  def update
    if @forum_question.update(fq_params)
      render json: @forum_question
    else
      render json: { errors: @forum_question.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("ForumQuestions#update error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  def destroy
    @forum_question.destroy
    head :no_content
  rescue StandardError => e
    Rails.logger.error("ForumQuestions#destroy error: #{e.message}")
    render json: { error: 'Erro interno' }, status: :internal_server_error
  end

  private

  def set_forum_question
    @forum_question = ForumQuestion.find(params[:id])
  end

  def fq_params
    params.require(:forum_question).permit(:subject, :description, :status, :requested_at,
                                           :user_id, :company_id, :product_id, :category_id)
  end
end
