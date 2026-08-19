# frozen_string_literal: true

module Api
  module V1
    class SocialFollowsController < BaseController
      before_action :authenticate_user!

      def index
        authorize SocialFollow

        follows = current_user.social_follows
        render json: { data: follows }
      end

      def create
        authorize SocialFollow

        followable = find_followable
        unless followable
          return render json: { error: { code: 'NOT_FOUND', message: 'Entidade não encontrada' } }, status: :not_found
        end

        follow = SocialFollow.find_or_create_by!(follower: current_user, followable: followable)
        render json: { status: 'success', data: follow }, status: :ok
      end

      def destroy
        authorize SocialFollow

        followable = find_followable
        if followable
          SocialFollow.where(follower: current_user, followable: followable).destroy_all
        end

        render json: { status: 'success' }, status: :ok
      end

      private

      def find_followable
        type = params[:followable_type]
        id = params[:followable_id]

        case type
        when 'Company' then Company.find_by(id: id)
        when 'ReviewerProfile' then ReviewerProfile.find_by(id: id)
        when 'Category' then Category.find_by(id: id)
        else nil
        end
      end
    end
  end
end
