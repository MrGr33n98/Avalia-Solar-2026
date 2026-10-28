# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailConnectionsController < BaseController
        skip_before_action :authenticate_api_user, only: :zoho_callback
        skip_before_action :require_internal_sales, only: :zoho_callback

        before_action :set_email_account, only: %i[show disconnect sync]

        # GET /api/v1/sales/email_connections
        def index
          records = account_scope.order(created_at: :desc).map do |account|
            serialize_account(account)
          end
          render json: { accounts: records }
        end

        # GET /api/v1/sales/email_connections/:id
        def show
          render json: { account: serialize_account(@account) }
        end

        # POST /api/v1/sales/email_connections/zoho/authorize
        def zoho_authorize
          unless current_user.company_id.present?
            return render_error_response(message: 'Organização obrigatória.', status: :forbidden, code: 'COMPANY_REQUIRED')
          end

          region = params[:region].presence || ENV.fetch('ZOHO_MAIL_REGION', 'us')
          client = ::Sales::EmailSync::ZohoApiClient.new(region)

          unless oauth_configured?
            return render_error_response(message: 'Configuração Zoho incompleta no servidor.', status: :service_unavailable, code: 'ZOHO_NOT_CONFIGURED')
          end

          include_send = params[:include_send] == true || params[:include_send] == 'true'
          state = ::Sales::EmailSync::OAuthStateService.generate_state(
            user: current_user,
            company_id: current_user.company_id,
            region: client.region
          )

          auth_url = client.authorization_url(
            state: state,
            redirect_uri: callback_url,
            include_send_scope: include_send
          )

          render json: { authorization_url: auth_url }
        rescue ArgumentError => e
          render_error_response(message: e.message, status: :bad_request, code: 'INVALID_REGION')
        end

        # GET /api/v1/sales/email_connections/zoho/callback
        def zoho_callback
          state = params[:state].to_s
          context = ::Sales::EmailSync::OAuthStateService.consume_state(state)
          return redirect_with_status('invalid_state') unless context

          if params[:error].present? || params[:code].blank?
            return redirect_with_status('denied')
          end

          actor = ::User.find_by(id: context[:user_id], company_id: context[:company_id])
          return redirect_with_status('invalid_state') unless actor && ::Sales::AuthorizationService.sales_access?(user: actor)

          client = ::Sales::EmailSync::ZohoApiClient.new(context[:region] || 'us')
          tokens = client.exchange_code(code: params[:code].to_s, redirect_uri: callback_url)

          access_token = tokens['access_token']
          refresh_token = tokens['refresh_token']
          expires_in = tokens['expires_in'].to_i

          if access_token.blank? || refresh_token.blank?
            return redirect_with_status('provider_error')
          end

          accounts_list = client.list_accounts(access_token: access_token)
          if accounts_list.empty?
            return redirect_with_status('mailbox_not_found')
          end

          # Select primary or first valid account with verified identity
          selected_account = accounts_list.find { |a| a[:is_primary] } || accounts_list.first
          target_email = selected_account[:email]
          target_account_id = selected_account[:account_id]

          account = ::Sales::EmailAccount.find_or_initialize_by(
            company_id: actor.company_id,
            provider: 'zoho',
            email: target_email
          )

          if account.persisted? && account.user_id != actor.id
            return redirect_with_status('already_connected')
          end

          account.user_id = actor.id
          account.provider_account_id = target_account_id
          account.provider_region = client.region
          account.access_token_encrypted = ::Sales::EmailSync::TokenVault.encrypt(access_token)
          account.refresh_token_encrypted = ::Sales::EmailSync::TokenVault.encrypt(refresh_token)
          account.access_token_expires_at = Time.current + (expires_in > 0 ? expires_in : 3600).seconds
          account.connection_status = 'healthy'
          account.sync_status = 'idle'
          account.sync_error = nil
          account.save!

          # Trigger initial sync job asynchronously
          ::Sales::SyncEmailAccountJob.perform_later(account.id, mode: 'incremental') rescue nil

          redirect_with_status('connected')
        rescue StandardError => e
          Rails.logger.error({ event: 'zoho_oauth_callback_failed', error_class: e.class.name, message: e.message }.to_json)
          redirect_with_status('provider_error')
        end

        # POST /api/v1/sales/email_connections/:id/disconnect
        def disconnect
          @account.disconnect!
          render json: { message: 'Conta desconectada com sucesso.', account: serialize_account(@account) }
        end

        # POST /api/v1/sales/email_connections/:id/sync
        def sync
          mode = params[:mode].presence || 'incremental'
          ::Sales::SyncEmailAccountJob.perform_later(@account.id, mode: mode)
          render json: { message: 'Sincronização iniciada.', status: 'syncing' }
        end

        private

        def set_email_account
          @account = account_scope.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Conta de e-mail não encontrada.', status: :not_found, code: 'MAILBOX_NOT_FOUND')
        end

        def account_scope
          ::Sales::EmailAccount.where(company_id: current_user.company_id, user_id: current_user.id)
        end

        def oauth_configured?
          ENV['ZOHO_MAIL_CLIENT_ID'].present? && ENV['ZOHO_MAIL_CLIENT_SECRET'].present?
        end

        def callback_url
          ENV['ZOHO_MAIL_REDIRECT_URI'].presence || "#{request_base_url}/api/v1/sales/email_connections/zoho/callback"
        end

        def request_base_url
          # Allow environment-based callback matching
          if request.host.include?('localhost') || request.host.include?('127.0.0.1')
            "#{request.protocol}#{request.host_with_port}"
          else
            ENV['API_BASE_URL'].presence || 'https://api.avaliasolar.com.br'
          end
        end

        def redirect_with_status(status)
          frontend_host = if request.host.include?('localhost')
                            'http://localhost:3000'
                          else
                            ENV['CRM_FRONTEND_URL'].presence || 'https://crm.avaliasolar.com.br'
                          end

          redirect_to "#{frontend_host}/dashboard/sales/settings/email/accounts?connection=#{status}",
                      allow_other_host: true
        end

        def serialize_account(account)
          {
            id: account.id,
            email: account.email,
            provider: account.provider,
            provider_account_id: account.provider_account_id,
            provider_region: account.provider_region,
            connection_status: account.connection_status,
            sync_status: account.sync_status,
            last_synced_at: account.last_synced_at,
            messages_imported: account.messages_imported,
            sync_error: account.sync_error,
            token_expired: account.token_expired?,
            created_at: account.created_at
          }
        end
      end
    end
  end
end
