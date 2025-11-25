# app/controllers/api/v1/auth_controller.rb
module Api
  module V1
    class AuthController < Api::V1::BaseController
      # Este controller é baseado em ActionController::API (direta ou indiretamente) e portanto
      # não possui o callback verify_authenticity_token usado para proteção CSRF em controllers
      # que herdam de ActionController::Base. Não é necessário (nem possível) chamar
      # skip_before_action :verify_authenticity_token aqui.

      def login
        email = params[:email]
        password = params[:password]

        user = User.find_by(email: email)
        if user&.valid_password?(password)
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

        render json: { error: 'Invalid email or password' }, status: :unauthorized
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
          EmailConfirmationJob.perform_later(user.id, user.confirmation_token)
          return render json: payload_for(user), status: :created
        end

        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error("[Auth] register failure: #{e.class}: #{e.message}")
        development_fallback('register', e)
      end

      def logout
        head :no_content
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

      private

      def user_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation, :date_of_birth)
      end

      def payload_for(user)
        token = jwt_encode(user_id: user.id)
        { token: token, user: user }
      end

      def jwt_encode(payload, exp = 24.hours.from_now)
        payload[:exp] = exp.to_i
        JWT.encode(payload, Rails.application.secret_key_base)
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
      def confirm_email
        token = params[:token]
        return render json: { error: 'Token inválido' }, status: :unprocessable_entity if token.blank?
        user = User.confirm_by_token(token)
        if user.errors.empty?
          return render json: { message: 'E-mail confirmado com sucesso.' }, status: :ok
        end
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
