module CompanyClaims
  class DecideRequest
    class InvalidTransition < StandardError; end

    def self.call(request:, admin:, note: nil)
      raise Pundit::NotAuthorizedError unless CompanyAccessRequestPolicy.new(admin, request).approve?

      request.with_lock do
        return false if request.approved?
        raise InvalidTransition, 'Apenas solicitações pendentes podem ser aprovadas.' unless request.pending?

        request.update!(
          status: 'approved',
          admin_note: note.presence,
          reviewed_at: Time.current,
          reviewed_by_admin_user: admin
        )
        request.user.update!(role: 'company') unless request.user.role == 'admin'
      end
      true
    end

    def self.reject!(request:, admin:, reason:)
      raise Pundit::NotAuthorizedError unless CompanyAccessRequestPolicy.new(admin, request).reject?
      raise ArgumentError, 'Informe o motivo da rejeição.' if reason.blank?

      request.with_lock do
        return :already_rejected if request.rejected?
        raise InvalidTransition, 'Apenas solicitações pendentes podem ser rejeitadas.' unless request.pending?

        request.update!(status: 'rejected', admin_note: reason, reviewed_at: Time.current,
                        reviewed_by_admin_user: admin)
      end
      :rejected
    end
  end
end
