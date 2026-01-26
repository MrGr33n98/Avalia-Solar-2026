# app/controllers/api/v1/auth_controller.rb
module Api
  module V1
    class AuthController < Api::V1::BaseController
      include JwtAuthenticatable
      
      # Este controller é baseado em ActionController::API (direta ou indiretamente) e portanto
      # não possui o callback verify_authenticity_token usado para proteção CSRF em controllers
      # que herdam de ActionController::Base. Não é necessário (nem possível) chamar
      # skip_before_action :verify_authenticity_token aqui.

      def login
        email, password, source = extract_credentials

        if email.blank? || password.blank?
          return render_error_response(
            error: 'Unprocessable Entity',
            message: 'Email e senha são obrigatórios.',
            status: :unprocessable_entity,
            code: 'MISSING_CREDENTIALS'
          )
        end

        user = User.find_by(email: email)
        if user&.valid_password?(password)
          if user.respond_to?(:active?) && !user.active?
            status_code =
              case user.status
              when 'pending' then 'USER_NOT_APPROVED'
              when 'rejected' then 'USER_REJECTED'
              when 'blocked' then 'USER_BLOCKED'
              else 'USER_INACTIVE'
              end
            return render_error_response(
              error: 'Forbidden',
              message: 'Usuário não está ativo.',
              status: :forbidden,
              code: status_code
            )
          end

          if !Rails.env.development? && user.respond_to?(:confirmed?) && !user.confirmed?
            return render json: {
              error: 'Email not confirmed',
              message: 'Please confirm your email before logging in.',
              code: 'EMAIL_NOT_CONFIRMED'
            }, status: :forbidden
          end
          return render json: payload_for(user), status: :ok
        end

        if Rails.env.development?
          target_email = email.presence || 'demo@example.com'
          mock_user = user || User.find_by(email: target_email)
          unless mock_user
            mock_user = User.create!(
              name: 'Usuário Demo',
              email: target_email,
              password: SecureRandom.hex(8)
            )
          end
          assign_company_for_demo(mock_user, email)
          return render json: payload_for(mock_user).merge(mocked: true), status: :ok
        end

        render_error_response(
          error: 'Unauthorized',
          message: 'Credenciais inválidas.',
          status: :unauthorized,
          code: 'INVALID_CREDENTIALS'
        )
      rescue StandardError => e
        Rails.logger.error("[Auth] login failure: #{e.class}: #{e.message}")
        development_fallback('login', e)
      end

      def register
        attrs = user_params
        unless ActiveModel::Type::Boolean.new.cast(params[:terms_accepted])
          return render json: { errors: ['Você deve aceitar os Termos e a Política de Privacidade'] }, status: :unprocessable_entity
        end

        user = User.new(attrs.merge(
          terms_accepted: true,
          terms_accepted_at: Time.current
        ))
        user.skip_confirmation_notification!
        if user.save
          user.send_confirmation_instructions
          return render json: payload_for(user), status: :created
        end

        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error("[Auth] register failure: #{e.class}: #{e.message}")
        development_fallback('register', e)
      end

      def signup
        register
      end

      def logout
        # Revoke the current JWT token
        if current_token
          revoke_current_token
          Rails.logger.info("[Auth] User logged out: user_id=#{current_user&.id} ip=#{request.remote_ip}")
        end
        
        # Clear cookie
        cookies.delete(:jwt_token, path: "/")
        
        render json: { 
          message: 'Logout successful',
          code: 'LOGOUT_SUCCESS'
        }, status: :ok
      end
      
      def logout_all
        # Revoke all tokens for current user (all devices)
        if current_user
          revoke_all_user_tokens
          Rails.logger.info("[Auth] User logged out from all devices: user_id=#{current_user.id} ip=#{request.remote_ip}")
        end
        
        # Clear cookie
        cookies.delete(:jwt_token, path: "/")
        
        render json: { 
          message: 'Logged out from all devices successfully',
          code: 'LOGOUT_ALL_SUCCESS'
        }, status: :ok
      end

      def me
        user = current_user
        if user
          if Rails.env.development? && user.company.nil?
            assign_company_for_demo(user, user.email)
            user.reload
          end
          render json: { user: user }, status: :ok
        else
          render json: { error: 'Not authenticated' }, status: :unauthorized
        end
      end

      def forgot_password
        email = params[:email]
        return render json: { error: 'Email inválido' }, status: :unprocessable_entity if email.blank?
        user = User.find_by(email: email)
        if user
          user.send_reset_password_instructions
        end
        render json: { message: 'Se o e-mail existir, você receberá instruções para redefinir a senha.' }, status: :ok
      end

      def reset_password
        token = params[:token]
        password = params[:password]
        password_confirmation = params[:password_confirmation]
        return render json: { error: 'Dados inválidos' }, status: :unprocessable_entity if token.blank? || password.blank? || password_confirmation.blank?

        user = User.reset_password_by_token({ reset_password_token: token, password: password, password_confirmation: password_confirmation })
        if user.errors.empty?
          return render json: { message: 'Senha redefinida com sucesso.' }, status: :ok
        end
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end

      def resend_confirmation
        email = params[:email]
        return render json: { error: 'Invalid email' }, status: :unprocessable_entity if email.blank?

        user = User.find_by(email: email)
        begin
          user.send_confirmation_instructions if user && user.respond_to?(:confirmed?) && !user.confirmed?
        rescue StandardError => e
          Rails.logger.error("[Auth] resend_confirmation failure: #{e.class}: #{e.message}")
        end

        # Anti-enumeration: do not reveal whether the email exists.
        render json: { message: 'Se o e-mail existir, voce recebera instrucoes para confirmar sua conta.' }, status: :ok
      end

      def confirm_email
        token = params[:token]
        return render json: { error: 'Token invalido' }, status: :unprocessable_entity if token.blank?

        user = User.confirm_by_token(token)
        if user.errors.empty?
          return render json: { message: 'Email confirmado com sucesso.' }, status: :ok
        end

        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def extract_credentials
        email = params[:email] || params.dig(:auth, :email) || params.dig(:user, :email)
        password = params[:password] || params.dig(:auth, :password) || params.dig(:user, :password)
        source =
          if params[:email] || params[:password]
            'root'
          elsif params[:auth]
            'auth'
          elsif params[:user]
            'user'
          else
            'unknown'
          end

        return [email, password, source]
      end

      def user_params
        target = params[:user].present? ? params.require(:user) : params
        target.permit(
          :name,
          :email,
          :password,
          :password_confirmation,
          :date_of_birth,
          :city,
          :state,
          :phone,
          :avatar
        )
      end

      def payload_for(user)
        token = jwt_encode(user_id: user.id)
        { token: token, user: user }
      end

      def jwt_encode(payload, exp = 24.hours.from_now)
        payload[:exp] = exp.to_i
        payload[:iat] = Time.current.to_i  # Issued at
        payload[:jti] = SecureRandom.uuid  # JWT ID for revocation
        JWT.encode(payload, Rails.application.secret_key_base)
      end
      
      def skip_token_check?
        # Skip revocation check for login, register, signup
        %w[login register signup forgot_password reset_password resend_confirmation confirm_email].include?(action_name)
      end

      def development_fallback(action, error)
        unless Rails.env.development?
          return render json: { error: 'Authentication failed' }, status: :internal_server_error
        end

        target_email = params[:email].presence || 'demo@example.com'
        mock_user = User.find_by(email: target_email)
        unless mock_user
          mock_user = User.create!(
            name: 'Usuário Demo',
            email: target_email,
            password: SecureRandom.hex(8)
          )
        end
        assign_company_for_demo(mock_user, params[:email])
        render json: payload_for(mock_user).merge(mocked: true, warning: error.message), status: :ok
      end

      def assign_company_for_demo(user, email)
        return if user.company.present?
        company = nil
        if email.to_s.downcase.include?('bsol')
          company = Company.find_by(name: 'BSol')
          company ||= Company.create!(name: 'BSol', description: 'Demo BSol')
        else
          company = Company.first
        end
        user.update(company: company) if company
      end
    end
  end
end

