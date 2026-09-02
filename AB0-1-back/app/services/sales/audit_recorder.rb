module Sales
  class AuditRecorder
    def self.call(record:, action:, actor: nil, request_id: nil, ip: nil)
      AuditLog.create!(company: record.try(:company), actor: actor, action: action,
                       auditable_type: record.class.name, auditable_id: record.id,
                       changeset: record.saved_changes, request_id: request_id, ip: ip)
    end
  end
end
