# frozen_string_literal: true

module ReviewCollection
  # Command: an admin's opt-in creates exactly one reusable brand-page invite.
  # No public GET or serializer is allowed to create an invite.
  class BrandPageInviteProvisioner
    class ConfigurationError < StandardError; end

    def self.call(company:)
      new(company:).call
    end

    def initialize(company:)
      @company = company
    end

    def call
      company.with_lock do
        return nil unless company.voice_review_cta_enabled?

        pepper = VoiceReviews::Config.contact_pepper
        raise ConfigurationError, 'Segredo de convites de avaliações não configurado' if pepper.blank?

        form = default_form!
        existing = VoiceReviewInvite.where(company_id: company.id, source: 'brand_page')
                                   .order(created_at: :desc).first
        return existing if existing&.active_now?

        # A revoked invite must stay revoked. Create a new code instead.
        code = "RV#{SecureRandom.alphanumeric(18)}"
        encryptor = ActiveSupport::MessageEncryptor.new(
          Rails.application.key_generator.generate_key('voice-review-code', 32)
        )
        invite = VoiceReviewInvite.create!(
          company: company,
          review_form: form,
          code_digest: OpenSSL::HMAC.hexdigest('SHA256', pepper, code),
          code_ciphertext: encryptor.encrypt_and_sign(code),
          idempotency_key: "brand-page-#{company.id}-#{SecureRandom.hex(8)}",
          kind: 'reusable_qr',
          source: 'brand_page',
          status: 'active',
          max_claims: nil,
          expires_at: nil
        )
        invite.public_code = code
        invite
      end
    end

    private

    attr_reader :company

    def default_form!
      company.review_forms.active.where(is_default: true).order(:id).first ||
        company.review_forms.active.order(:id).first ||
        company.review_forms.create!(
          name: 'Avaliação Geral',
          public_title: "Avalie sua experiência com #{company.name}",
          form_type: 'general',
          status: 'active',
          is_default: true,
          settings: ReviewForm::DEFAULT_SETTINGS
        )
    end
  end
end
