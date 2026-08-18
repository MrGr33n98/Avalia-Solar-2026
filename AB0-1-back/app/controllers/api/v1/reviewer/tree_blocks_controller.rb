# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class TreeBlocksController < BaseController
        before_action :authenticate_api_user
        before_action :require_reviewer_role
        before_action :set_block, only: %i[update destroy]

        def index
          render json: current_profile.creator_tree_blocks.order(:position, :id)
        end

        def create
          block = current_profile.creator_tree_blocks.new(block_params)
          block.save!
          render json: block, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update
          @block.update!(block_params)
          render json: @block
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def destroy
          @block.destroy!
          head :no_content
        end

        def reorder
          ids = Array(params[:ids]).map(&:to_i)
          blocks = current_profile.creator_tree_blocks.where(id: ids).index_by(&:id)
          return render json: { error: 'Blocos inválidos' }, status: :unprocessable_entity unless blocks.size == ids.size

          CreatorTreeBlock.transaction do
            ids.each_with_index { |id, index| blocks.fetch(id).update!(position: index) }
          end
          render json: current_profile.creator_tree_blocks.order(:position, :id)
        end

        private

        def current_profile
          @current_profile ||= current_user.reviewer_profile || current_user.create_reviewer_profile!
        end

        def set_block
          @block = current_profile.creator_tree_blocks.find(params[:id])
        end

        def block_params
          params.require(:block).permit(
            :block_type, :title, :subtitle, :url, :position, :active, :company_id, :publication_id, metadata: {}
          )
        end

        def require_reviewer_role
          return if current_user&.review_user?

          render json: { error: 'Acesso restrito a creators.' }, status: :forbidden
        end
      end
    end
  end
end