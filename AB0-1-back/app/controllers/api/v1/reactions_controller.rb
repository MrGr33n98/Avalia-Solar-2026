# frozen_string_literal: true

module Api
  module V1
    class ReactionsController < BaseController
      before_action :authenticate_api_user

      def create
        reactable = find_reactable
        unless reactable
          return render json: { error: { code: 'NOT_FOUND', message: 'Item não encontrado' } }, status: :not_found
        end

        reaction_type = params[:reaction_type] || 'useful'
        reaction = Reaction.find_or_initialize_by(user: current_user, reactable: reactable)
        reaction.reaction_type = reaction_type

        authorize reaction

        reaction.save!

        render json: { status: 'success', data: { reaction_type: reaction.reaction_type } }, status: :ok
      end

      def destroy
        reactable = find_reactable
        unless reactable
          return render json: { error: { code: 'NOT_FOUND', message: 'Item não encontrado' } }, status: :not_found
        end

        reaction = Reaction.find_by(user: current_user, reactable: reactable)
        if reaction
          authorize reaction
          reaction.destroy
        else
          authorize Reaction.new(user: current_user, reactable: reactable)
        end

        render json: { status: 'success' }, status: :ok
      end

      private

      def find_reactable
        type = params[:reactable_type]
        id = params[:reactable_id]

        case type
        when 'ReviewerPublication' then ReviewerPublication.find_by(id: id)
        when 'Review' then Review.find_by(id: id)
        when 'GroupPost'
          post = GroupPost.find_by(id: id)
          return nil unless post

          group = post.group
          return nil unless group.status == 'active'

          if group.visibility == 'private_hidden' || group.visibility == 'private_visible'
            membership = group.active_membership_for(current_user)
            return nil unless membership.present?
          end

          if post.status != 'published'
            membership = group.active_membership_for(current_user)
            is_moderator = membership.present? && membership.role.in?(%w[moderator admin owner])
            return nil unless is_moderator || current_user&.admin?
          end

          post
        else nil
        end
      end
    end
  end
end
