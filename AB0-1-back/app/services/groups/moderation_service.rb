# frozen_string_literal: true

module Groups
  class ModerationService
    class Error < StandardError; end
    class Unsupported < Error; end

    def self.approve_membership(membership:, approver:)
      MembershipService.approve(membership: membership, approver: approver)
    end

    def self.reject_membership(membership:, approver:)
      new(membership: membership, approver: approver).reject_membership
    end

    def initialize(membership:, approver:)
      @membership = membership
      @approver = approver
    end

    def reject_membership
      raise Unsupported, 'Comunidades indisponíveis' unless Groups::Feature.enabled?

      group = @membership.group
      raise Unsupported, 'Solicitação não está pendente' unless @membership.pending?
      raise Unsupported, 'Usuário sem permissão para moderar' unless GroupPolicy.new(@approver, group).manage_members?

      @membership.update!(status: 'rejected', approved_by: @approver)
      DomainEvent.create!(
        event_type: 'group.membership_rejected',
        aggregate_type: 'Group',
        aggregate_id: group.id,
        payload: { group_membership_id: @membership.id, user_id: @membership.user_id },
        occurred_at: Time.current
      )
      @membership
    end
  end
end