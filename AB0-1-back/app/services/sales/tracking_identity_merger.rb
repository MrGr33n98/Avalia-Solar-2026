module Sales
  class TrackingIdentityMerger
    def self.call(session_id:, contact:)
      session = TrackingSession.find_by!(session_id: session_id)
      TrackingSession.transaction do
        session.update!(contact: contact, account: contact.account)
        TrackingEvent.where(session_id: session_id).update_all(contact_id: contact.id, account_id: contact.sales_account_id)
      end
      session
    end
  end
end
