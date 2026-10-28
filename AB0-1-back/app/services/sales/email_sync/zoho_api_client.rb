# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Sales
  module EmailSync
    class ZohoApiClient
      AUTH_HOSTS = {
        'us' => ['https://accounts.zoho.com', 'https://mail.zoho.com'],
        'eu' => ['https://accounts.zoho.eu', 'https://mail.zoho.eu'],
        'in' => ['https://accounts.zoho.in', 'https://mail.zoho.in'],
        'au' => ['https://accounts.zoho.com.au', 'https://mail.zoho.com.au'],
        'ca' => ['https://accounts.zohocloud.ca', 'https://mail.zohocloud.ca'],
        'jp' => ['https://accounts.zoho.jp', 'https://mail.zoho.jp']
      }.freeze

      READ_SCOPES = 'ZohoMail.accounts.READ,ZohoMail.messages.READ,ZohoMail.folders.READ'
      SEND_SCOPES = 'ZohoMail.messages.CREATE'

      class ApiError < StandardError
        attr_reader :status_code, :error_code, :raw_body

        def initialize(message, status_code: nil, error_code: nil, raw_body: nil)
          super(message)
          @status_code = status_code
          @error_code = error_code
          @raw_body = raw_body
        end
      end

      class RateLimitError < ApiError; end
      class AuthError < ApiError; end

      attr_reader :region

      def initialize(region = 'us')
        normalized_region = region.to_s.downcase.strip
        normalized_region = 'us' if normalized_region.blank?
        unless AUTH_HOSTS.key?(normalized_region)
          raise ArgumentError, "Região Zoho inválida '#{region}'. Regiões suportadas: #{AUTH_HOSTS.keys.join(', ')}"
        end

        @region = normalized_region
      end

      def auth_host
        AUTH_HOSTS.fetch(region).first
      end

      def mail_host
        AUTH_HOSTS.fetch(region).last
      end

      def client_id
        ENV.fetch('ZOHO_MAIL_CLIENT_ID')
      end

      def client_secret
        ENV.fetch('ZOHO_MAIL_CLIENT_SECRET')
      end

      def authorization_url(state:, redirect_uri:, include_send_scope: false)
        scopes = include_send_scope ? "#{READ_SCOPES},#{SEND_SCOPES}" : READ_SCOPES
        query = {
          client_id: client_id,
          response_type: 'code',
          redirect_uri: redirect_uri,
          scope: scopes,
          access_type: 'offline',
          prompt: 'consent',
          state: state
        }
        "#{auth_host}/oauth/v2/auth?#{URI.encode_www_form(query)}"
      end

      def exchange_code(code:, redirect_uri:)
        uri = URI("#{auth_host}/oauth/v2/token")
        params = {
          code: code,
          grant_type: 'authorization_code',
          client_id: client_id,
          client_secret: client_secret,
          redirect_uri: redirect_uri
        }
        execute_post(uri, params)
      end

      def refresh_token(refresh_token:)
        uri = URI("#{auth_host}/oauth/v2/token")
        params = {
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
          client_id: client_id,
          client_secret: client_secret
        }
        execute_post(uri, params)
      end

      def revoke_token(token:)
        uri = URI("#{auth_host}/oauth/v2/token/revoke")
        params = { token: token }
        execute_post(uri, params) rescue nil
      end

      # Accounts Discovery
      def list_accounts(access_token:)
        uri = URI("#{mail_host}/api/accounts")
        data = execute_get(uri, access_token)
        Array(data['data']).map do |item|
          {
            account_id: item['accountId']&.to_s,
            email: (item['primaryEmailAddress'] || item['emailAddress']).to_s.downcase,
            account_name: item['accountName'] || item['displayName'],
            is_primary: item['isPrimary'] == true
          }
        end
      end

      # Folders
      def list_folders(access_token:, account_id:)
        uri = URI("#{mail_host}/api/accounts/#{account_id}/folders")
        data = execute_get(uri, access_token)
        Array(data['data']).map do |folder|
          {
            folder_id: folder['folderId']&.to_s,
            name: folder['folderName'],
            type: folder['folderType'], # Inbox, Sent, Drafts, Trash, etc.
            unread_count: folder['unreadCount'].to_i,
            total_count: folder['totalCount'].to_i
          }
        end
      end

      # Messages list
      def list_messages(access_token:, account_id:, folder_id:, limit: 50, start: 1)
        uri = URI("#{mail_host}/api/accounts/#{account_id}/messages/view")
        uri.query = URI.encode_www_form({
          folderId: folder_id,
          limit: [limit, 50].min,
          start: start
        })
        data = execute_get(uri, access_token)
        Array(data['data']).map do |msg|
          {
            message_id: msg['messageId']&.to_s,
            thread_id: msg['threadId']&.to_s,
            folder_id: msg['folderId']&.to_s,
            subject: msg['subject'],
            from: msg['fromAddress'],
            to: msg['toAddress'],
            received_time: msg['receivedTime'],
            sent_date_in_gmt: msg['sentDateInGMT'],
            has_attachment: msg['hasAttachment'].to_i > 0,
            summary: msg['summary'],
            status: msg['status']
          }
        end
      end

      # Single message details
      def get_message_content(access_token:, account_id:, message_id:)
        uri = URI("#{mail_host}/api/accounts/#{account_id}/folders/messages/#{message_id}/content")
        execute_get(uri, access_token)
      end

      # Reply to existing email message
      def send_reply(access_token:, account_id:, message_id:, body_text:, body_html: nil, subject: nil)
        uri = URI("#{mail_host}/api/accounts/#{account_id}/messages/#{message_id}/reply")
        params = {
          content: body_html.presence || body_text,
          mailFormat: body_html.present? ? 'html' : 'plaintext'
        }
        params[:subject] = subject if subject.present?

        execute_post_json(uri, params, access_token)
      end

      private

      def execute_get(uri, access_token)
        req = Net::HTTP::Get.new(uri)
        req['Authorization'] = "Zoho-oauthtoken #{access_token}"
        req['Accept'] = 'application/json'
        perform_request(uri, req)
      end

      def execute_post(uri, form_params, access_token = nil)
        req = Net::HTTP::Post.new(uri)
        req['Authorization'] = "Zoho-oauthtoken #{access_token}" if access_token
        req['Content-Type'] = 'application/x-www-form-urlencoded'
        req.body = URI.encode_www_form(form_params)
        perform_request(uri, req)
      end

      def execute_post_json(uri, json_payload, access_token)
        req = Net::HTTP::Post.new(uri)
        req['Authorization'] = "Zoho-oauthtoken #{access_token}"
        req['Content-Type'] = 'application/json'
        req.body = json_payload.to_json
        perform_request(uri, req)
      end

      def perform_request(uri, req)
        res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 15) do |http|
          http.request(req)
        end

        parsed = JSON.parse(res.body) rescue { 'raw' => res.body }

        case res.code.to_i
        when 200..299
          parsed
        when 401
          raise AuthError.new('Zoho token expired or invalid.', status_code: 401, raw_body: parsed)
        when 429
          raise RateLimitError.new('Zoho rate limit reached.', status_code: 429, raw_body: parsed)
        else
          msg = parsed.is_a?(Hash) ? (parsed['message'] || parsed['error']) : res.message
          raise ApiError.new("Zoho API error (#{res.code}): #{msg}", status_code: res.code.to_i, raw_body: parsed)
        end
      end
    end
  end
end
