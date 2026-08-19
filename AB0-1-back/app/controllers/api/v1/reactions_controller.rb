# frozen_string_literal: true

module Api
  module V1
    class ReactionsController < BaseController
      before_action :authenticate_user!

      def create
        authorize Reaction

        reactable = find_reactable
        unless reactable
          return render json: { error: { code: 'NOT_FOUND', message: 'Item não encontrado' } }, status: :not_found
        end

        reaction_type = params[:reaction_type] || 'useful'
        reaction = Reaction.find_or_initialize_by(user: current_user, reactable: reactable)
        reaction.reaction_type = reaction_type
        reaction.save!

        render json: { status: 'success', data: { reaction_type: reaction.reaction_type } }, status: :ok
      end

      def destroy
        authorize Reaction

        reactable = find_reactable
        if reactable
          Reaction.where(user: current_user, reactable: reactable).destroy_all
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
        else nil
        end
      end
    end
  end
end
