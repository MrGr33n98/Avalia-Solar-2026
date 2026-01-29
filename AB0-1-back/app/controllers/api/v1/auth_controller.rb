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
              message: 'Usuário não está ativo.',
              status: :forbidden,
              code: status_code
            )
          end

          # Verificação de e-mail confirmado (Obrigatória conforme solicitado)
          if !Rails.env.development? && user.respond_to?(:confirmed?) && !user.confirmed?
            Rails.logger.warn("[Auth] Login blocked for unconfirmed user: #{email}")
            return render_error_response(
              message: 'Por favor, confirme seu e-mail antes de fazer login.',
              status: :forbidden,
              code: 'EMAIL_NOT_CONFIRMED'
            )
          end

          Analytics::TrackEventService.call(
            event_type: 'login_completed',
            user: user,
            company_id: user.company_id,
            metadata: request_metadata.merge(method: 'email')
          )

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
          message: 'Credenciais inválidas.',
          status: :unauthorized,
          code: 'INVALID_CREDENTIALS'
        )
      rescue StandardError => e
        Rails.logger.error("[Auth] login failure: #{e.class}: #{e.message}")
        development_fallback('login', e)
      end

      def register
        Rails.logger.info "[Audit] Initing user registration. Email: #{params[:email] || params.dig(:user, :email)}"
        attrs = user_params
        
        # Injeta localização da borda (Cloudflare) se não fornecida
        if @edge_location.present?
          attrs[:city] = @edge_location[:city] if attrs[:city].blank?
          attrs[:state] = @edge_location[:state] if attrs[:state].blank?
          Rails.logger.info "[Audit] Edge Location applied to registration: #{attrs[:city]}/#{attrs[:state]}"
        end

        terms_accepted = params[:terms_accepted] || (params[:user] && params[:user][:terms_accepted])
        unless ActiveModel::Type::Boolean.new.cast(terms_accepted)
          Rails.logger.warn "[Audit] Registration failed: terms not accepted for #{attrs[:email]}"
          return render_error_response(
            message: 'Você deve aceitar os Termos e a Política de Privacidade',
            status: :unprocessable_entity,
            code: 'TERMS_NOT_ACCEPTED'
          )
        end

        user = User.new(attrs.merge(
          terms_accepted: true,
          terms_accepted_at: Time.current
        ))

        if params[:user] && params[:user][:avatar].present?
          Rails.logger.info "[Audit] Photo Flow: User avatar detected in registration request for #{user.email}"
        end

        user.skip_confirmation_notification!
        if user.save
          Rails.logger.info "[Audit] User created successfully: ID #{user.id}, Email: #{user.email}"
          
          if user.avatar.attached?
            Rails.logger.info "[Audit] Photo Flow: User avatar attached successfully for ID #{user.id}"
          end

          user.send_confirmation_instructions
          Rails.logger.info "[Audit] Confirmation email sent to #{user.email}"
          
          Analytics::TrackEventService.call(
            event_type: 'registration_completed',
            user: user,
            company_id: user.company_id,
            metadata: request_metadata.merge(
              city: attrs[:city], 
              state: attrs[:state]
            )
          )

          return render json: payload_for(user), status: :created
        end

        Rails.logger.warn "[Audit] User registration failed: #{user.errors.full_messages.join(', ')}"
        render_error_response(
          message: 'Erro ao criar conta',
          status: :unprocessable_entity,
          code: 'REGISTRATION_ERROR',
          details: user.errors.full_messages
        )
      rescue StandardError => e
        Rails.logger.error "[Audit] Critical error in register: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        development_fallback('register', e)
      end

      def signup
        register
      end

      def logout
        # Revoke the current JWT token
        if current_token
          user_id = current_user&.id
          company_id = current_user&.company_id
          
          revoke_current_token
          Rails.logger.info("[Auth] User logged out: user_id=#{user_id} ip=#{request.remote_ip}")
          
          Analytics::TrackEventService.call(
            event_type: 'logout_performed',
            user: current_user,
            company_id: company_id,
            metadata: request_metadata
          )
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
          render_error_response(
            message: 'Not authenticated',
            status: :unauthorized,
            code: 'NOT_AUTHENTICATED'
          )
        end
      end

      def forgot_password
        email = params[:email]
        if email.blank?
          return render_error_response(
            message: 'Email inválido',
            status: :unprocessable_entity,
            code: 'INVALID_EMAIL'
          )
        end
        user = User.find_by(email: email)
        if user
          user.send_reset_password_instructions
          Rails.logger.info("[Auth] Reset password instructions triggered for #{email}")
        else
          Rails.logger.info("[Auth] Skip forgot_password for #{email}: User not found")
        end
        render json: { message: 'Se o e-mail existir, você receberá instruções para redefinir a senha.' }, status: :ok
      end

      def reset_password
        # Tentar extrair token do header Authorization (hash fragment)
        token = extract_token_from_header
        password = params[:password]
        password_confirmation = params[:password_confirmation]
        
        # Se não houver no header, permitir temporariamente via query string para links de e-mail
        if token.blank?
          token = params[:reset_password_token] || params[:token]
          if token.present?
            Rails.logger.info "[Audit] Token found in query string for password reset (IP: #{request.remote_ip})"
          end
        end

        if token.blank? || password.blank? || password_confirmation.blank?
          return render_error_response(
            message: 'Dados inválidos',
            status: :unprocessable_entity,
            code: 'INVALID_DATA'
          )
        end

        user = User.reset_password_by_token({ 
          reset_password_token: token, 
          password: password, 
          password_confirmation: password_confirmation 
        })
        
        if user.errors.empty?
          Rails.logger.info("[Auth] Password reset successfully: #{user.email} (IP: #{request.remote_ip})")
          
          # Logar usuário automaticamente após reset
          jwt_token = jwt_encode(user_id: user.id)
          set_jwt_cookie(jwt_token)
          
          return render json: { 
            message: 'Senha redefinida com sucesso.',
            token: jwt_token,
            user: user,
            auto_login: true
          }, status: :ok
        end
        
        Rails.logger.error("[Auth] Password reset failed: #{user.errors.full_messages.join(', ')}")
        render_error_response(
          message: 'Erro ao redefinir senha',
          status: :unprocessable_entity,
          code: 'RESET_PASSWORD_ERROR',
          details: user.errors.full_messages
        )
      end

      def resend_confirmation
        email = params[:email]
        if email.blank?
          return render_error_response(
            message: 'Email inválido',
            status: :unprocessable_entity,
            code: 'INVALID_EMAIL'
          )
        end

        user = User.find_by(email: email)
        if user && user.respond_to?(:confirmed?) && !user.confirmed?
          begin
            user.send_confirmation_instructions
            Rails.logger.info("[Auth] Confirmation instructions resent to #{email}")
          rescue StandardError => e
            Rails.logger.error("[Auth] resend_confirmation failure for #{email}: #{e.class}: #{e.message}")
          end
        else
          Rails.logger.info("[Auth] Skip resend_confirmation for #{email}: User not found, already confirmed or not supported")
        end

        # Anti-enumeration: do not reveal whether the email exists.
        render json: { message: 'Se o e-mail existir, você receberá instruções para confirmar sua conta.' }, status: :ok
      end

      def confirm_email
        # SEGURANÇA: Priorizar token no header Authorization (hash fragment)
        token = extract_token_from_header
        
        # Se não houver no header, tentar na URL (necessário para links de e-mail)
        if token.blank?
          token = params[:confirmation_token] || params[:token]
          if token.present?
            Rails.logger.info "[Audit] Token found in query string for email confirmation (IP: #{request.remote_ip})"
          end
        end
        
        if token.blank?
          Rails.logger.warn("[Auth] Confirmation blocked: token missing (IP: #{request.remote_ip})")
          return render_error_response(
            message: 'Token inválido ou ausente',
            status: :unprocessable_entity,
            code: 'INVALID_TOKEN'
          )
        end

        Rails.logger.info "[Audit] Processing email confirmation for token: #{token[0..5]}... (IP: #{request.remote_ip})"

        user = User.confirm_by_token(token)
        if user.errors.empty?
          # Track event
          Analytics::TrackEventService.call(
            user: user,
            company_id: user.company_id,
            event_type: 'email_confirmed',
            metadata: { ip: request.remote_ip }
          )

          # Ativar usuário automaticamente após confirmação (se não for empresa ou se já estiver aprovado)
          if user.pending? && (user.regular_user? || user.review_user?)
            user.active!
            Rails.logger.info("[Audit] User status updated to active after confirmation: #{user.email}")
          end

          Rails.logger.info("[Audit] Email confirmed successfully: #{user.email} (IP: #{request.remote_ip})")
          
          # Logar usuário automaticamente após confirmação
          jwt_token = jwt_encode(user_id: user.id)
          set_jwt_cookie(jwt_token)
          
          return render json: { 
            message: 'Email confirmado com sucesso.',
            token: jwt_token,
            user: user,
            auto_login: true
          }, status: :ok
        end

        Rails.logger.error("[Audit] Confirmation failed for token: #{user.errors.full_messages.join(', ')}")
        render_error_response(
          message: 'Erro ao confirmar e-mail',
          status: :unprocessable_entity,
          code: 'CONFIRMATION_ERROR',
          details: user.errors.full_messages
        )
      rescue StandardError => e
        Rails.logger.error "[Audit] Critical error in confirm_email: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        development_fallback('confirm_email', e)
      end

      private

      def extract_token_from_header
        # Extrai token do header Authorization: Bearer TOKEN
        auth_header = request.headers['Authorization']
        return nil if auth_header.blank?
        
        auth_header.split(' ').last
      end

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
          :avatar,
          :terms_accepted,
          :company_id
        )
      end

      def payload_for(user)
        token = jwt_encode(user_id: user.id)
        set_jwt_cookie(token)
        { token: token, user: user }
      end

      def skip_token_check?
        # Pular verificação de revogação para ações que não usam JWT ou onde o token é de outro tipo
        # (como token de confirmação ou reset de senha enviado no header Authorization)
        %w[login register signup forgot_password reset_password confirm_email resend_confirmation].include?(action_name)
      end

      def development_fallback(action, error)
        unless Rails.env.development?
          return render_error_response(
            message: 'Erro interno na autenticação',
            status: :internal_server_error,
            code: 'AUTH_INTERNAL_ERROR'
          )
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

