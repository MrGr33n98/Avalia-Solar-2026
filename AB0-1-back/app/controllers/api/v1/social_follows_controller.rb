# frozen_string_literal: true

module Api
  module V1
    class SocialFollowsController < BaseController
      before_action :authenticate_api_user

      def index
        authorize SocialFollow

        follows = SocialFollow.where(follower: current_user)
        render json: { data: follows }
      end

      def create
        followable = find_followable
        unless followable
          return render json: { error: { code: 'NOT_FOUND', message: 'Entidade não encontrada' } }, status: :not_found
        end

        follow = SocialFollow.new(follower: current_user, followable: followable)
        authorize follow

        follow = create_follow!(followable)
        render json: { status: 'success', data: follow }, status: :ok
      end

      def destroy
        followable = find_followable
        return render json: { status: 'success' }, status: :ok unless followable

        follow = SocialFollow.new(follower: current_user, followable: followable)
        authorize follow
        SocialFollow.where(follower: current_user, followable: followable).destroy_all

        render json: { status: 'success' }, status: :ok
      end

      private

      def create_follow!(followable)
        attributes = { follower: current_user, followable: followable }
        SocialFollow.find_by(attributes) || SocialFollow.create!(attributes)
      rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid
        existing_follow = SocialFollow.find_by(attributes)
        return existing_follow if existing_follow

        raise
      end

      def find_followable
        type = params[:followable_type]
        id = params[:followable_id]

        case type
        when 'Company' then ::Company.find_by(id: id)
        when 'ReviewerProfile' then ::ReviewerProfile.find_by(id: id)
        when 'Category' then ::Category.find_by(id: id)
        end
      end
    end
  end
end
