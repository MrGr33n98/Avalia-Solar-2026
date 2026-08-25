# frozen_string_literal: true

module Groups
  class MembershipService
    class Error < StandardError; end
    class Forbidden < Error; end
    class OwnerCannotLeave < Error; end

    def self.join(group:, user:)
      new(group: group, user: user).join
    end

    def self.leave(group:, user:)
      new(group: group, user: user).leave
    end

    def self.approve(membership:, approver:)
      new(group: membership.group, user: membership.user).approve(membership: membership, approver: approver)
    end

    def self.reject(membership:, rejecter:)
      new(group: membership.group, user: membership.user).reject(membership: membership, rejecter: rejecter)
    end

    def initialize(group:, user:)
      @group = group
      @user = user
    end

    def join
      raise Forbidden, 'Comunidades indisponíveis' unless Groups::Feature.enabled?
      raise Forbidden, 'Usuário inválido' unless @user.is_a?(User)
      raise Forbidden, 'Usuário não está ativo' unless @user.active_status?
      raise Forbidden, 'Grupo não aceita novas participações' unless @group.status == 'active'
      raise Forbidden, 'Este grupo exige convite' if @group.membership_mode == 'invite_only'
      raise Forbidden, 'Grupo privado exige convite' unless @group.visibility == 'public'

      GroupMembership.transaction(requires_new: true) do
        membership = GroupMembership.where(group_id: @group.id, user_id: @user.id).lock.first
        membership ||= GroupMembership.new(group: @group, user: @user)
        return membership if membership.persisted? && (membership.active? || membership.pending?)
        raise Forbidden, 'Usuário banido deste grupo' if membership.status == 'banned'

        active = @group.membership_mode == 'open'
        membership.assign_attributes(
          role: 'member',
          status: active ? 'active' : 'pending',
          joined_at: active ? Time.current : nil,
          approved_at: active ? Time.current : nil
        )
        membership.save!
        increment_member_count! if active
        publish_event(active ? 'group.joined' : 'group.membership_requested', membership)

        unless active
          begin
            staff = @group.group_memberships.where(role: ['owner', 'moderator']).active.includes(:user).map(&:user)
            GroupMembershipNotifier.with(
              group_name: @group.name,
              group_slug: @group.slug,
              event: 'requested'
            ).deliver(staff)
          rescue => e
            Rails.logger.error("Failed to deliver membership requested notification: #{e.message}")
          end
        end

        membership
      end
    rescue ActiveRecord::RecordNotUnique
      GroupMembership.find_by!(group: @group, user: @user)
    end

    def leave
      raise Forbidden, 'Grupo não está habilitado' unless Groups::Feature.enabled?

      membership = GroupMembership.where(group: @group, user: @user).lock.first
      return nil unless membership&.active?
      raise OwnerCannotLeave, 'Owner deve transferir o grupo antes de sair' if membership.role == 'owner'

      GroupMembership.transaction do
        membership.update!(status: 'left', joined_at: nil)
        decrement_member_count!
        publish_event('group.left', membership)
      end
      membership
    end

    def approve(membership:, approver:)
      raise Forbidden, 'Comunidades indisponíveis' unless Groups::Feature.enabled?
      raise Forbidden, 'Membership não pertence ao grupo' unless membership.group_id == @group.id
      raise Forbidden, 'Usuário sem permissão para aprovar participação' unless GroupPolicy.new(approver, @group).manage_members?
      raise Forbidden, 'Solicitação não está pendente' unless membership.pending?

      GroupMembership.transaction do
        membership.update!(status: 'active', joined_at: Time.current, approved_at: Time.current, approved_by: approver)
        increment_member_count!
        publish_event('group.membership_approved', membership)

        begin
          GroupMembershipNotifier.with(
            group_name: @group.name,
            group_slug: @group.slug,
            event: 'approved'
          ).deliver(membership.user)
        rescue => e
          Rails.logger.error("Failed to deliver membership approved notification: #{e.message}")
        end
      end
      membership
    end

    def reject(membership:, rejecter:)
      raise Forbidden, 'Comunidades indisponíveis' unless Groups::Feature.enabled?
      raise Forbidden, 'Membership não pertence ao grupo' unless membership.group_id == @group.id
      raise Forbidden, 'Usuário sem permissão para rejeitar participação' unless GroupPolicy.new(rejecter, @group).manage_members?
      raise Forbidden, 'Solicitação não está pendente' unless membership.pending?

      GroupMembership.transaction do
        membership.update!(status: 'rejected', approved_at: nil, approved_by: nil)
        publish_event('group.membership_rejected', membership)
      end
      membership
    end

    private

    def increment_member_count!
      @group.class.lock.where(id: @group.id).update_all(
        @group.class.sanitize_sql_array(
          ['members_count = members_count + 1, updated_at = ?', Time.current]
        )
      )
      @group.reload
    end

    def decrement_member_count!
      @group.class.lock.where(id: @group.id).where('members_count > 0').update_all(
        @group.class.sanitize_sql_array(
          ['members_count = members_count - 1, updated_at = ?', Time.current]
        )
      )
      @group.reload
    end

    def publish_event(event_type, membership)
      DomainEvent.create!(
        event_type: event_type,
        aggregate_type: 'Group',
        aggregate_id: @group.id,
        payload: { group_membership_id: membership.id, user_id: @user.id, status: membership.status },
        occurred_at: Time.current
      )
    end
  end
end