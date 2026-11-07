module VoiceReviews
  class InviteService
    class Error < StandardError; end

    def self.call(company:, review_form:, actor:, kind:, idempotency_key:, campaign_id: nil)
      new(company:, review_form:, actor:, kind:, idempotency_key:, campaign_id:).call
    end

    def initialize(company:, review_form:, actor:, kind:, idempotency_key:, campaign_id: nil)
      @company = company
      @review_form = review_form
      @actor = actor
      @kind = kind.to_s
      @idempotency_key = idempotency_key.to_s
      @campaign_id = campaign_id.to_s.strip.presence
    end

    def call
      validate!
      invite = VoiceReviewInvite.find_by(issued_by_user_id: actor.id, company_id: company.id, idempotency_key:)
      return hydrate(invite) if invite

      raw_code = "RV#{SecureRandom.alphanumeric(14)}"
      invite = VoiceReviewInvite.create!(company:, review_form:, issued_by_user: actor, code_digest: digest(raw_code),
                                         code_ciphertext: encrypt(raw_code),
                                         idempotency_key:, kind:, campaign_id:, expires_at: 30.days.from_now,
                                         max_claims: kind == 'personal' ? 1 : nil)
      VoiceReviews::EventRecorder.record!(event_name: 'voice_invite_created', company:, invite:,
                                          dedupe_key: "invite-created:#{invite.id}", properties: { kind: })
      hydrate(invite, raw_code)
    rescue ActiveRecord::RecordNotUnique
      hydrate(VoiceReviewInvite.find_by!(issued_by_user_id: actor.id, company_id: company.id, idempotency_key:))
    end

    private

    attr_reader :company, :review_form, :actor, :kind, :idempotency_key, :campaign_id

    def validate!
      raise Error, 'kind inválido' unless %w[personal reusable_qr].include?(kind)
      raise Error, 'Idempotency-Key inválido' unless idempotency_key.length.between?(12, 128)
      raise Error, 'Formulário inválido para esta empresa' unless review_form.company_id == company.id && review_form.active?
    end

    def digest(value)
      OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, value)
    end

    def encrypt(value)
      encryptor = ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('voice-review-code', 32))
      encryptor.encrypt_and_sign(value)
    end

    def hydrate(invite, raw_code = nil)
      invite.public_code = raw_code if raw_code.present?
      invite
    end
  end
end
