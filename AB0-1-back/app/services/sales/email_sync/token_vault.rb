# frozen_string_literal: true

require 'active_support/message_encryptor'

module Sales
  module EmailSync
    class TokenVault
      SALT = 'crm-zoho-oauth-token-vault-v1'

      def self.encrypt(plaintext)
        return nil if plaintext.blank?

        cipher.encrypt_and_sign(plaintext)
      end

      def self.decrypt(ciphertext)
        return nil if ciphertext.blank?

        cipher.decrypt_and_verify(ciphertext)
      rescue ActiveSupport::MessageEncryptor::InvalidMessage, ActiveSupport::MessageVerifier::InvalidSignature => e
        Rails.logger.error("[TokenVault] Decryption failed: #{e.class} - #{e.message}")
        nil
      end

      def self.cipher
        secret = Rails.application.secret_key_base || 'crm-default-vault-secret-key-32chars!!'
        key = ActiveSupport::KeyGenerator.new(secret).generate_key(SALT, 32)
        ActiveSupport::MessageEncryptor.new(key)
      end
    end
  end
end
