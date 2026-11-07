module VoiceReviews
  class FormInviteResolver
    def self.call(review_form)
      new(review_form).call
    end

    def initialize(review_form)
      @review_form = review_form
    end

    def call
      return nil unless review_form&.active?

      invite = find_or_create_default_invite
      return nil unless invite

      {
        short_code: invite.public_code,
        public_url: invite.public_url,
        whatsapp_url: invite.whatsapp_url,
        qr_code_path: "/api/v1/review_forms/#{review_form.token}/voice_qr_code"
      }
    rescue StandardError => e
      Rails.logger.warn("[VoiceReviews][FormInviteResolver] failed form=#{review_form&.id}: #{e.message}")
      nil
    end

    private

    attr_reader :review_form

    def find_or_create_default_invite
      key = "default-form-qr-#{review_form.id}"
      existing = VoiceReviewInvite.where(
        company_id: review_form.company_id, review_form_id: review_form.id, idempotency_key: key
      ).first
      return existing if existing&.active_now?

      raw_code = "RV#{SecureRandom.alphanumeric(14)}"
      invite = VoiceReviewInvite.create!(
        company: review_form.company,
        review_form: review_form,
        code_digest: OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, raw_code),
        code_ciphertext: encrypt(raw_code),
        idempotency_key: key,
        kind: 'reusable_qr',
        source: 'review_form_hub',
        expires_at: 365.days.from_now
      )
      invite.public_code = raw_code
      invite
    end

    def encrypt(value)
      secret = Rails.application.key_generator.generate_key('voice-review-code', 32)
      encryptor = ActiveSupport::MessageEncryptor.new(secret)
      encryptor.encrypt_and_sign(value)
    end
  end
end

