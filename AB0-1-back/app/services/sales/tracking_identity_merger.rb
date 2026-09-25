module Sales
  class TrackingIdentityMerger
    def self.call(session:, contact:)
      TrackingSession.transaction do
        session.update!(contact: contact, account: contact.account, company_id: contact.account&.company_id)
        TrackingEvent.where(session_id: session.session_id, company_id: session.company_id)
                     .update_all(contact_id: contact.id, account_id: contact.sales_account_id)
      end
      session
    end
  end
end
