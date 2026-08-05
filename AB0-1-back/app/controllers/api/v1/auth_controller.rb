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
        email, password, = extract_credentials

        if email.blank? || password.blank?
          return render_error_response(
            message: 'Email e senha são obrigatórios.',
            status: :unprocessable_entity,
            code: 'MISSING_CREDENTIALS'
          )
        end

        user = User.find_by(email: email)
        if user&.valid_password?(password)
          # Se o usuário não tem role ou é apenas 'user', ele pode logar
          # Se ele tem role 'company', verificamos se ele tem vínculos ativos
          if user.company_user? && user.active_member_companies.empty?
            # Se for um usuário que deveria ser company mas não tem empresa vinculada,
            # talvez ele tenha acabado de se cadastrar ou o vínculo foi removido.
            # Permitimos o login, mas o frontend redirecionará para o fluxo de "vincular empresa"
          end

          if user.respond_to?(:active_status?) && !user.active_status?
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
            Rails.logger.warn('[Auth] Login blocked for unconfirmed user')
            return render_error_response(
              message: 'Por favor, confirme seu e-mail antes de fazer login.',
              status: :forbidden,
              code: 'EMAIL_NOT_CONFIRMED'
            )
          end

          Analytics::TrackEventService.call(
            event_type: 'login_completed',
            user: user,
            company_id: user.company_id || user.active_member_companies.first&.id,
            metadata: request_metadata.merge(
              method: 'email',
              companies_count: user.active_member_companies.count,
              primary_role: user.role
            )
          )

          Analytics::PostHogService.identify(
            distinct_id: user.posthog_distinct_id,
            properties: user.posthog_properties
          )

          payload = payload_for(user)
          if user.company_user?
            active_companies = user.active_member_companies.select(:id, :name, :slug)
            payload[:companies] = active_companies
            if active_companies.any?
              payload[:active_company_id] = active_companies.first.id
              payload[:redirect_to] = "/company-dashboard?company_id=#{active_companies.first.id}"
            else
              payload[:redirect_to] = '/select-company'
            end
          elsif user.review_user?
            payload[:redirect_to] = '/review-dashboard'
          else
            payload[:redirect_to] = '/'
          end

          return render json: payload, status: :ok
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
        Rails.logger.info '[Audit] Initing user registration'
        attrs = user_params

        # Injeta localização da borda (Cloudflare) se não fornecida
        if @edge_location.present?
          attrs[:city] = @edge_location[:city] if attrs[:city].blank?
          attrs[:state] = @edge_location[:state] if attrs[:state].blank?
          Rails.logger.info "[Audit] Edge Location applied to registration: #{attrs[:city]}/#{attrs[:state]}"
        end

        terms_accepted = params[:terms_accepted] || (params[:user] && params[:user][:terms_accepted])
        unless ActiveModel::Type::Boolean.new.cast(terms_accepted)
          Rails.logger.warn '[Audit] Registration failed: terms not accepted'
          return render_error_response(
            message: 'Você deve aceitar os Termos e a Política de Privacidade',
            status: :unprocessable_entity,
            code: 'TERMS_NOT_ACCEPTED'
          )
        end

        requested_role = params[:role] || (params[:user] && params[:user][:role]) || 'review'
        requested_role = 'review' unless User::ROLES.include?(requested_role)

        user = User.new(attrs.merge(
                          terms_accepted: true,
                          terms_accepted_at: Time.current,
                          role: requested_role,
                          status: requested_role == 'company' ? :pending : :active
                        ))

        if params[:user] && params[:user][:avatar].present?
          Rails.logger.info '[Audit] Photo Flow: User avatar detected in registration request'
        end

        user.skip_confirmation_notification!
        if user.save
          Rails.logger.info "[Audit] User created successfully: ID #{user.id}"

          if user.avatar.attached?
            Rails.logger.info "[Audit] Photo Flow: User avatar attached successfully for ID #{user.id}"
          end

          user.send_confirmation_instructions
          Rails.logger.info "[Audit] Confirmation email sent for user ID #{user.id}"

          Analytics::TrackEventService.call(
            event_type: 'user_registered',
            user: user,
            company_id: user.company_id,
            metadata: request_metadata.merge(
              role: user.role,
              city: attrs[:city],
              state: attrs[:state]
            )
          )

          Analytics::PostHogService.identify(
            distinct_id: user.posthog_distinct_id,
            properties: user.posthog_properties
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
          Rails.logger.info("[Auth] User logged out: user_id=#{user_id}")

          Analytics::TrackEventService.call(
            event_type: 'logout_performed',
            user: current_user,
            company_id: company_id,
            metadata: request_metadata
          )
        end

        revoke_refresh_token

        # Clear cookies using unified helper to ensure domain consistency
        clear_auth_cookies

        render json: {
          message: 'Logout successful',
          code: 'LOGOUT_SUCCESS'
        }, status: :ok
      end

      def logout_all
        # Revoke all tokens for current user (all devices)
        if current_user
          revoke_all_user_tokens
          Rails.logger.info("[Auth] User logged out from all devices: user_id=#{current_user.id}")
        end

        revoke_refresh_token

        # Clear cookies using unified helper to ensure domain consistency
        clear_auth_cookies

        render json: {
          message: 'Logged out from all devices successfully',
          code: 'LOGOUT_ALL_SUCCESS'
        }, status: :ok
      end

      def refresh
        refresh_token = extract_refresh_token
        if refresh_token.blank?
          return render_error_response(
            message: 'Refresh token ausente',
            status: :unauthorized,
            code: 'REFRESH_TOKEN_MISSING'
          )
        end

        payload = jwt_decode(refresh_token)
        unless payload && payload['typ'] == 'refresh'
          return render_error_response(
            message: 'Refresh token invÃ¡lido',
            status: :unauthorized,
            code: 'INVALID_REFRESH_TOKEN'
          )
        end

        if JwtBlacklistService.revoked?(refresh_token)
          return render_error_response(
            message: 'Refresh token revogado',
            status: :unauthorized,
            code: 'REFRESH_TOKEN_REVOKED'
          )
        end

        user = User.find_by(id: payload['user_id'])
        if user.nil? || (user.respond_to?(:active_status?) && !user.active_status?)
          return render_error_response(
            message: 'UsuÃ¡rio nÃ£o estÃ¡ ativo',
            status: :forbidden,
            code: 'USER_INACTIVE'
          )
        end

        tokens = issue_tokens_for(user, rotate_refresh: true, previous_refresh_token: refresh_token)
        render json: { token: tokens[:access_token], user: serialized_user(user) }, status: :ok
      rescue StandardError => e
        Rails.logger.error("[Auth] refresh failure: #{e.class}: #{e.message}")
        render_error_response(
          message: 'Erro ao atualizar sessÃ£o',
          status: :internal_server_error,
          code: 'REFRESH_FAILED'
        )
      end

      def me
        user = current_user
        if user
          render json: { user: serialized_user(user) }, status: :ok
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
          Rails.logger.info('[Auth] Reset password instructions triggered')
        else
          Rails.logger.info('[Auth] Skip forgot_password: User not found')
        end
        render json: { message: 'Se o e-mail existir, você receberá instruções para redefinir a senha.' }, status: :ok
      end

      def reset_password
        # Tentar extrair token do header Authorization (hash fragment)
        token = extract_token_from_header
        password = params[:password]
        password_confirmation = params[:password_confirmation]

        # Se n?o houver no header, validar se token veio via query string (bloqueado)
        if token.blank?
          query_token = request.query_parameters['reset_password_token'] || request.query_parameters['token']
          if query_token.present?
            Rails.logger.warn '[Security] Password reset token rejected from query string'
            return render_error_response(
              message: 'Token deve ser enviado no header Authorization ou no corpo da requisi??o.',
              status: :unprocessable_entity,
              code: 'TOKEN_IN_QUERY'
            )
          end
          token = params[:reset_password_token] || params[:token]
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
          Rails.logger.info("[Auth] Password reset successfully: user_id=#{user.id}")

          # Logar usuário automaticamente após reset
          tokens = issue_tokens_for(user)

          return render json: {
            message: 'Senha redefinida com sucesso.',
            token: tokens[:access_token],
            user: serialized_user(user),
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
        if user.respond_to?(:confirmed?) && !user.confirmed?
          begin
            user.send_confirmation_instructions
            Rails.logger.info('[Auth] Confirmation instructions resent')
          rescue StandardError => e
            Rails.logger.error("[Auth] resend_confirmation failure: #{e.class}: #{e.message}")
          end
        else
          Rails.logger.info('[Auth] Skip resend_confirmation: User not found, already confirmed or not supported')
        end

        # Anti-enumeration: do not reveal whether the email exists.
        render json: { message: 'Se o e-mail existir, você receberá instruções para confirmar sua conta.' }, status: :ok
      end

      def confirm_email
        # SEGURANÇA: Priorizar token no header Authorization (hash fragment)
        token = extract_token_from_header
        # Se n?o houver no header, validar se token veio via query string (bloqueado)
        if token.blank?
          query_token = request.query_parameters['confirmation_token'] || request.query_parameters['token']
          if query_token.present?
            Rails.logger.warn '[Security] Confirmation token rejected from query string'
            return render_error_response(
              message: 'Token deve ser enviado no header Authorization ou no corpo da requisi??o.',
              status: :unprocessable_entity,
              code: 'TOKEN_IN_QUERY'
            )
          end
          token = params[:confirmation_token] || params[:token]
        end

        if token.blank?
          Rails.logger.warn('[Auth] Confirmation blocked: token missing')
          return render_error_response(
            message: 'Token inválido ou ausente',
            status: :unprocessable_entity,
            code: 'INVALID_TOKEN'
          )
        end

        Rails.logger.info '[Audit] Processing email confirmation'

        user = User.confirm_by_token(token)
        if user.errors.empty?
          # Track event
          Analytics::TrackEventService.call(
            user: user,
            company_id: user.company_id,
            event_type: 'email_confirmed',
            metadata: { ip: request.remote_ip }
          )

          Analytics::PostHogService.identify(
            distinct_id: user.posthog_distinct_id,
            properties: user.posthog_properties
          )
          Analytics::PostHogService.track_server_event(
            'email_confirmed',
            user.id,
            { role: user.role }
          )

          # Ativar usuário automaticamente após confirmação (se não for empresa ou se já estiver aprovado)
          if user.pending? && (user.regular_user? || user.review_user?)
            user.active!
            Rails.logger.info("[Audit] User status updated to active after confirmation: user_id=#{user.id}")
          end

          Rails.logger.info("[Audit] Email confirmed successfully: user_id=#{user.id}")

          # Logar usuário automaticamente após confirmação
          tokens = issue_tokens_for(user)

          return render json: {
            message: 'Email confirmado com sucesso.',
            token: tokens[:access_token],
            user: serialized_user(user),
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

        auth_header.split.last
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

        [email, password, source]
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
          :company_id,
          :role
        )
      end

      def payload_for(user)
        tokens = issue_tokens_for(user)
        { token: tokens[:access_token], user: serialized_user(user) }
      end

      def serialized_user(user)
        UserSerializer.new(user).as_json
      end

      def issue_tokens_for(user, rotate_refresh: true, previous_refresh_token: nil)
        access_exp = access_token_expires_at
        refresh_exp = refresh_token_expires_at

        access_token = jwt_encode({ user_id: user.id, typ: 'access' }, access_exp)
        set_jwt_cookie(access_token, expires: access_exp)

        refresh_token = previous_refresh_token
        if rotate_refresh || refresh_token.blank?
          refresh_token = jwt_encode({ user_id: user.id, typ: 'refresh' }, refresh_exp)
          set_refresh_cookie(refresh_token, expires: refresh_exp)
          revoke_token(previous_refresh_token) if previous_refresh_token.present?
        else
          set_refresh_cookie(refresh_token, expires: refresh_exp)
        end

        { access_token: access_token, refresh_token: refresh_token }
      end

      def access_token_expires_at
        15.minutes.from_now
      end

      def refresh_token_expires_at
        30.days.from_now
      end

      def extract_refresh_token
        cookies.signed[:refresh_token].presence || extract_token_from_header
      end

      def revoke_refresh_token
        token = extract_refresh_token
        return unless token.present?

        revoke_token(token)
      end

      def revoke_token(token)
        JwtBlacklistService.revoke_token(token)
      end

      def skip_token_check?
        # Pular verificação de revogação para ações que não usam JWT ou onde o token é de outro tipo
        # (como token de confirmação ou reset de senha enviado no header Authorization)
        %w[login register signup forgot_password reset_password confirm_email resend_confirmation
           refresh].include?(action_name)
      end

      def development_fallback(_action, _error)
        render_error_response(
          message: 'Erro interno na autenticação',
          status: :internal_server_error,
          code: 'AUTH_INTERNAL_ERROR'
        )
      end
    end
  end
end
