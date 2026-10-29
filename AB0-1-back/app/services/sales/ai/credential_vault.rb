# frozen_string_literal: true

require 'active_support/message_encryptor'

module Sales
  module Ai
    class CredentialVault
      SALT = 'crm-ai-openrouter-credential-vault-v1'

      def self.encrypt(plaintext)
        return nil if plaintext.blank?

        cipher.encrypt_and_sign(plaintext.to_s.strip)
      end

      def self.decrypt(ciphertext)
        return nil if ciphertext.blank?

        cipher.decrypt_and_verify(ciphertext)
      rescue ActiveSupport::MessageEncryptor::InvalidMessage, ActiveSupport::MessageVerifier::InvalidSignature => e
        Rails.logger.error("[Sales::Ai::CredentialVault] Decryption failed: #{e.class}")
        nil
      end

      def self.mask(raw_key)
        clean = raw_key.to_s.strip
        return nil if clean.blank?
        return '****' if clean.length <= 8

        prefix = clean[0, 8]
        suffix = clean[-4, 4]
        "#{prefix}...#{suffix}"
      end

      def self.cipher
        secret = Rails.application.secret_key_base.presence || 'crm-ai-default-vault-secret-key-32ch!'
        key = ActiveSupport::KeyGenerator.new(secret).generate_key(SALT, 32)
        ActiveSupport::MessageEncryptor.new(key)
      end
    end
  end
end

