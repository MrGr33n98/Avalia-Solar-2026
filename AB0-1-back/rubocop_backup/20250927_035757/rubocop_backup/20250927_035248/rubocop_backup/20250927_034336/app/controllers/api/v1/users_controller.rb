class Api::V1::UsersController < Api::V1::BaseController
  before_action :set_user, only: %i[show update destroy]

  def me
    render json: current_user
  end

  def index
    @users = User.all
    render json: @users
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: @user
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Usuário não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @user = User.new(user_params)

    if @user.save
      render json: @user, status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @user.update(user_params)
      render json: @user
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Usuário não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def destroy
    @user.destroy
    render json: { message: 'Usuário excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Usuário não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end
end
