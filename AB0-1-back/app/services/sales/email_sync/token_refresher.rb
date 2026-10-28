# frozen_string_literal: true

module Sales
  module EmailSync
    class TokenRefresher
      MUTEX = Mutex.new

      def self.refresh_if_needed!(email_account)
        return nil unless email_account.zoho?
        return TokenVault.decrypt(email_account.access_token_encrypted) unless email_account.token_expired?

        MUTEX.synchronize do
          # Re-check inside lock
          email_account.reload
          unless email_account.token_expired?
            return TokenVault.decrypt(email_account.access_token_encrypted)
          end

          refresh_token = TokenVault.decrypt(email_account.refresh_token_encrypted)
          if refresh_token.blank?
            email_account.update!(connection_status: 'needs_reconnect', sync_status: 'error', sync_error: 'Token de atualização ausente.')
            return nil
          end

          client = ZohoApiClient.new(email_account.provider_region || 'us')
          response = client.refresh_token(refresh_token: refresh_token)
          access_token = response['access_token']
          expires_in = response['expires_in'].to_i

          if access_token.present?
            email_account.update!(
              access_token_encrypted: TokenVault.encrypt(access_token),
              access_token_expires_at: Time.current + (expires_in > 0 ? expires_in : 3600).seconds,
              connection_status: 'healthy',
              sync_error: nil
            )
            access_token
          else
            email_account.update!(connection_status: 'needs_reconnect', sync_status: 'error', sync_error: 'Falha ao renovar token.')
            nil
          end
        rescue ZohoApiClient::AuthError => e
          email_account.update!(connection_status: 'needs_reconnect', sync_status: 'error', sync_error: e.message)
          nil
        rescue StandardError => e
          Rails.logger.error("[TokenRefresher] Error: #{e.class} - #{e.message}")
          nil
        end
      end
    end
  end
end
