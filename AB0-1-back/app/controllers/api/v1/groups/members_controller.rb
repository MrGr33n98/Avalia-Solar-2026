# frozen_string_literal: true

module Api
  module V1
    module Groups
      class MembersController < BaseController
        before_action :authenticate_api_user, except: :index
        before_action :ensure_groups_enabled!
        before_action :load_group

        def index
          authorize @group, :show?
          members = @group.group_memberships.active.includes(:user).order(joined_at: :asc, id: :asc)
          members = members.limit(100)
          render json: { data: members.map { |membership| GroupMemberSerializer.new(membership).as_json } }
        end

        def update
          authorize @group, :manage_members?
          membership = @group.group_memberships.find(params[:id])

          raise ::Groups::MembershipService::Forbidden, 'Não é possível alterar o proprietário' if membership.role == 'owner'

          new_role = params[:role]
          unless new_role.in?(%w[member moderator])
            return render json: { error: { code: 'BAD_REQUEST', message: 'Role inválida' } }, status: :bad_request
          end

          group_policy = ::GroupPolicy.new(current_user, @group)
          unless group_policy.owner_or_admin?
            raise ::Groups::MembershipService::Forbidden, 'Apenas proprietários podem alterar cargos'
          end

          membership.update!(role: new_role)
          render json: { status: 'success', data: GroupMemberSerializer.new(membership).as_json }, status: :ok
        end

        def suspend
          authorize @group, :manage_members?
          membership = @group.group_memberships.find(params[:id])

          raise ::Groups::MembershipService::Forbidden, 'Não é possível suspender o proprietário' if membership.role == 'owner'

          if membership.active?
            GroupMembership.transaction do
              membership.update!(status: 'banned', role: 'member')
              @group.class.lock.where(id: @group.id).where('members_count > 0').update_all(
                @group.class.sanitize_sql_array(
                  ['members_count = members_count - 1, updated_at = ?', Time.current]
                )
              )
            end
          else
            membership.update!(status: 'banned', role: 'member')
          end

          render json: { status: 'success', data: GroupMemberSerializer.new(membership).as_json }, status: :ok
        end

        def restore
          authorize @group, :manage_members?
          membership = @group.group_memberships.find(params[:id])

          raise ::Groups::MembershipService::Forbidden, 'Membro não está banido' unless membership.status == 'banned'

          GroupMembership.transaction do
            membership.update!(status: 'active', joined_at: Time.current)
            @group.class.lock.where(id: @group.id).update_all(
              @group.class.sanitize_sql_array(
                ['members_count = members_count + 1, updated_at = ?', Time.current]
              )
            )
          end

          render json: { status: 'success', data: GroupMemberSerializer.new(membership).as_json }, status: :ok
        end

        private

        def ensure_groups_enabled!
          return if ::Groups::Feature.enabled?

          render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
          false
        end

        def load_group
          @group = ::GroupPolicy::Scope.new(current_user, ::Group).resolve.find_by!(slug: params[:group_slug])
        end
      end
    end
  end
end