class Api::V1::UsersController < Api::V1::BaseController
  before_action :set_user, only: %i[show update destroy]
  before_action :authenticate_api_user, except: %i[create]
  before_action :authorize_index!, only: %i[index]
  before_action :authorize_user_access!, only: %i[show update destroy]

  def me
    render json: user_with_avatar(current_user)
  end

  # FIX #3: Implementar endpoint GET /api/v1/users/me_companies
  def me_companies
    @companies = current_user.member_companies
    render json: { companies: @companies }
  end

  # FIX #4: Implementar endpoint POST /api/v1/users/switch_company
  def switch_company
    company_id = params[:company_id]
    if current_user.member_companies.exists?(id: company_id)
      if current_user.update(company_id: company_id)
        render json: { 
          message: 'Empresa alterada com sucesso', 
          company_id: company_id,
          user: user_with_avatar(current_user)
        }
      else
        render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Você não tem permissão para acessar esta empresa ou empresa inexistente' }, status: :forbidden
    end
  end

  def index
    @users = User.all
    render json: @users.map { |u| user_with_avatar(u) }
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def show
    render json: user_with_avatar(@user)
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Usuário não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def create
    @user = User.new(user_params)
    @user.role = 'user' # Ensure it's a regular user

    if @user.save
      render json: user_with_avatar(@user), status: :created
    else
      render_error_response(
        error: 'Unprocessable Entity',
        message: 'Não foi possível criar o usuário',
        status: :unprocessable_entity,
        code: 'UNPROCESSABLE_ENTITY',
        details: @user.errors.full_messages
      )
    end
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def update
    if @user.update(user_params)
      render json: user_with_avatar(@user)
    else
      render_error_response(
        error: 'Unprocessable Entity',
        message: 'Não foi possível atualizar o usuário',
        status: :unprocessable_entity,
        code: 'UNPROCESSABLE_ENTITY',
        details: @user.errors.full_messages
      )
    end
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Usuário não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  def destroy
    @user.destroy
    render json: { message: 'Usuário excluído' }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render_error_response(error: 'Not Found', message: 'Usuário não encontrado', status: :not_found, code: 'NOT_FOUND')
  rescue StandardError => e
    Rails.logger.error("Users error: #{e.message}")
    render_error_response(error: 'Internal Server Error', message: 'Erro interno no servidor', status: :internal_server_error, code: 'INTERNAL_ERROR')
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    permitted = [
      :name, :email, :password, :password_confirmation,
      :city, :state, :phone, :avatar
    ]

    if current_user&.admin?
      permitted += [:role, :status, :company_id]
    end

    params.require(:user).permit(*permitted)
  end

  def authorize_index!
    return if current_user&.admin?

    render_error_response(
      error: 'Forbidden',
      message: 'Not authorized to list users',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
  end

  def authorize_user_access!
    return if current_user&.admin?

    if @user.present? && current_user == @user
      return
    end

    render_error_response(
      error: 'Forbidden',
      message: 'Not authorized to access this user',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
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
