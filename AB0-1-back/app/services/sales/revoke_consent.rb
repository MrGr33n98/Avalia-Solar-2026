# frozen_string_literal: true

module Sales
  class RevokeConsent
    def self.call(consent:, actor:)
      authorized = actor&.admin? || consent.contact.account.owner_id == actor&.id
      raise Pundit::NotAuthorizedError, 'usuário sem acesso ao consentimento' unless authorized

      consent.update!(granted: false, revoked_at: Time.current)
      consent
      AuditRecorder.call(record: consent, action: 'consent_revoked', actor: actor)
      consent
    end
  end
end
