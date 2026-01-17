class Api::V1::UsersController < Api::V1::BaseController
  before_action :set_user, only: %i[show update destroy]

  def me
    render json: user_with_avatar(current_user)
  end

  def index
    @users = User.all
    render json: @users.map { |u| user_with_avatar(u) }
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def show
    render json: user_with_avatar(@user)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Usuário não encontrado' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def create
    @user = User.new(user_params)
    @user.role = 'user' # Ensure it's a regular user

    if @user.save
      render json: user_with_avatar(@user), status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  def update
    if @user.update(user_params)
      render json: user_with_avatar(@user)
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
    params.require(:user).permit(:name, :email, :password, :password_confirmation, :city, :state, :phone, :avatar)
  end

  def user_with_avatar(user)
    return nil unless user
    user_json = user.as_json
    if user.avatar.attached?
      user_json[:avatar_url] = url_for(user.avatar)
    end
    user_json
  end
end
