# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'
require 'securerandom'

module Api
  module V1
    module Sales
      # Phase 1: connect an existing Zoho Mail account. No email is imported or sent here.
      class EmailConnectionsController < BaseController
        before_action :authenticate_api_user, except: :zoho_callback
        before_action :require_internal_sales, except: :zoho_callback

        AUTH_HOSTS = {
          'us' => ['https://accounts.zoho.com', 'https://mail.zoho.com'],
          'eu' => ['https://accounts.zoho.eu', 'https://mail.zoho.eu'],
          'in' => ['https://accounts.zoho.in', 'https://mail.zoho.in'],
          'au' => ['https://accounts.zoho.com.au', 'https://mail.zoho.com.au'],
          'ca' => ['https://accounts.zohocloud.ca', 'https://mail.zohocloud.ca'],
          'jp' => ['https://accounts.zoho.jp', 'https://mail.zoho.jp']
        }.freeze
        SCOPES = 'ZohoMail.accounts.READ,ZohoMail.messages.READ,ZohoMail.folders.READ'.freeze
        CALLBACK_PATH = '/api/v1/sales/email_connections/zoho/callback'.freeze
        STATE_TTL = 10.minutes

        def index
          records = account_scope.order(created_at: :desc).map do |account|
            { id: account.id, email: account.email, provider: account.provider,
              sync_status: account.sync_status, last_synced_at: account.last_synced_at }
          end
          render json: { accounts: records }
        end

        def zoho_authorize
          unless current_user.company_id.present?
            return render_error_response(message: 'Organização obrigatória.', status: :forbidden, code: 'COMPANY_REQUIRED')
          end
          unless oauth_configured?
            return render_error_response(message: 'Configuração Zoho incompleta.', status: :service_unavailable, code: 'ZOHO_NOT_CONFIGURED')
          end
          state = SecureRandom.urlsafe_base64(36)
          Rails.cache.write(cache_key(state), { user_id: current_user.id, company_id: current_user.company_id }, expires_in: STATE_TTL)
          query = {
            client_id: ENV.fetch('ZOHO_MAIL_CLIENT_ID'),
            response_type: 'code',
            redirect_uri: callback_url,
            scope: SCOPES,
            access_type: 'offline',
            prompt: 'consent',
            state: state
          }
          render json: { authorization_url: "#{auth_host}/oauth/v2/auth?#{URI.encode_www_form(query)}" }
        end

        # OAuth provider redirect: authenticated by single-use state, not browser session.
        # Never put tokens, authorization codes or provider error strings in redirect URLs.
        def zoho_callback
          state = params[:state].to_s
          return redirect_with_status('invalid_state') if state.blank? || state.length > 180
          context = Rails.cache.read(cache_key(state))
          Rails.cache.delete(cache_key(state))
          return redirect_with_status('invalid_state') unless context.is_a?(Hash)
          return redirect_with_status('denied') if params[:error].present? || params[:code].blank?

          actor = ::User.find_by(id: context[:user_id], company_id: context[:company_id])
          return redirect_with_status('invalid_state') unless actor && ::Sales::AuthorizationService.sales_access?(user: actor)
          return redirect_with_status('configuration_required') unless oauth_configured?

          tokens = exchange_code(params[:code].to_s)
          return redirect_with_status('provider_error') unless tokens['access_token'].present? && tokens['refresh_token'].present?
          addresses = retrieve_accounts(tokens['access_token'])
          return redirect_with_status('mailbox_not_found') if addresses.empty?
          # Only attach the actual authenticated Zoho address; never trust browser-provided addresses.
          address = addresses.first
          account = ::Sales::EmailAccount.find_or_initialize_by(company_id: actor.company_id, provider: 'zoho', email: address)
          if account.persisted? && account.user_id != actor.id
            return redirect_with_status('already_connected')
          end
          account.user_id = actor.id
          account.access_token_encrypted = cipher.encrypt_and_sign(tokens['access_token'])
          account.refresh_token_encrypted = cipher.encrypt_and_sign(tokens['refresh_token'])
          account.sync_status = 'idle'
          account.sync_error = nil
          account.save!
          redirect_with_status('connected')
        rescue StandardError => e
          Rails.logger.error({ event: 'zoho_oauth_callback_failed', error_class: e.class.name }.to_json)
          redirect_with_status('provider_error')
        end

        private

        def account_scope
          ::Sales::EmailAccount.where(company_id: current_user.company_id, user_id: current_user.id)
        end

        def region
          raw = ENV.fetch('ZOHO_MAIL_REGION', 'us').downcase
          AUTH_HOSTS.key?(raw) ? raw : 'us'
        end

        def auth_host
          AUTH_HOSTS.fetch(region).first
        end

        def mail_host
          AUTH_HOSTS.fetch(region).last
        end

        def oauth_configured?
          ENV['ZOHO_MAIL_CLIENT_ID'].present? && ENV['ZOHO_MAIL_CLIENT_SECRET'].present? &&
            ENV['ZOHO_MAIL_REDIRECT_URI'] == callback_url
        end

        def callback_url
          # Fixed application callback, not user-supplied.
          'https://api.avaliasolar.com.br' + CALLBACK_PATH
        end

        def redirect_with_status(status)
          redirect_to "https://crm.avaliasolar.com.br/dashboard/sales/settings/email/accounts?connection=#{status}",
                      allow_other_host: true
        end

        def cache_key(state)
          "crm:zoho:oauth:#{Digest::SHA256.hexdigest(state)}"
        end

        def cipher
          key = Rails.application.key_generator.generate_key('crm-zoho-oauth-tokens-v1', 32)
          ActiveSupport::MessageEncryptor.new(key)
        end

        def exchange_code(code)
          uri = URI("#{auth_host}/oauth/v2/token")
          response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 12) do |http|
            http.post(uri.request_uri, URI.encode_www_form(
              code: code, grant_type: 'authorization_code',
              client_id: ENV.fetch('ZOHO_MAIL_CLIENT_ID'),
              client_secret: ENV.fetch('ZOHO_MAIL_CLIENT_SECRET'),
              redirect_uri: callback_url
            ), 'Content-Type' => 'application/x-www-form-urlencoded')
          end
          raise 'Zoho token exchange failed' unless response.is_a?(Net::HTTPSuccess)
          JSON.parse(response.body)
        end

        def retrieve_accounts(token)
          uri = URI("#{mail_host}/api/accounts")
          response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 12) do |http|
            http.get(uri.request_uri, 'Authorization' => "Zoho-oauthtoken #{token}")
          end
          raise 'Zoho account lookup failed' unless response.is_a?(Net::HTTPSuccess)
          body = JSON.parse(response.body)
          Array(body['data']).filter_map do |item|
            address = item['primaryEmailAddress'] || item['emailAddress']
            address.to_s.downcase if address.to_s.match?(URI::MailTo::EMAIL_REGEXP)
          end.uniq
        end
      end
    end
  end
end
