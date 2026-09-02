module Sales
  class LgpdDataRequest
    def self.anonymize_contact!(contact:, actor: nil)
      Contact.transaction do
        contact.update!(first_name: 'Contato', last_name: 'Anonimizado', email: nil, phone: nil,
                        whatsapp: nil, linkedin_url: nil, metadata: contact.metadata.merge('anonymized_at' => Time.current.iso8601))
        Consent.where(contact: contact).update_all(granted: false, revoked_at: Time.current, updated_at: Time.current)
        AuditRecorder.call(record: contact, action: 'lgpd_anonymized', actor: actor)
      end
      contact
    end
  end
end
