# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class TreeBlocksController < BaseController
        before_action :authenticate_api_user
        before_action :require_reviewer_role
        before_action :set_block, only: %i[update destroy]

        def index
          profile = current_profile
          render json: { profile: profile_payload(profile), blocks: owned_blocks(profile).order(:position, :id).map { |block| block_payload(block) } }
        end

        def create
          profile = current_profile
          block = CreatorTreeBlock.new(block_params.merge(reviewer_id: profile.id))
          return render_validation_error(block) unless block.save

          render json: block_payload(block), status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_validation_error(e.record)
        end

        def update
          return render_validation_error(@block) unless @block.update(block_params)

          render json: block_payload(@block)
        rescue ActiveRecord::RecordInvalid => e
          render_validation_error(e.record)
        end

        def destroy
          @block.destroy!
          head :no_content
        end

        def reorder
          ids = Array(params[:ids]).map(&:to_i)
          blocks = owned_blocks(current_profile).where(id: ids).index_by(&:id)
          return render json: { error: 'Blocos inválidos' }, status: :unprocessable_entity unless blocks.size == ids.size

          CreatorTreeBlock.transaction do
            ids.each_with_index { |id, index| blocks.fetch(id).update!(position: index) }
          end
          profile = current_profile
          render json: { profile: profile_payload(profile), blocks: owned_blocks(profile).order(:position, :id).map { |block| block_payload(block) } }
        end

        private

        def current_profile
          @current_profile ||= current_user.reviewer_profile || current_user.create_reviewer_profile!
        end

        def set_block
          @block = owned_blocks(current_profile).find(params[:id])
        end

        def owned_blocks(profile)
          CreatorTreeBlock.where(reviewer_id: profile.id)
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

        def render_validation_error(record)
          render json: {
            error: {
              code: 'validation_failed',
              message: 'Não foi possível salvar o bloco.',
              fields: record.errors.to_hash
            }
          }, status: :unprocessable_entity
        end

        def block_payload(block)
          block.as_json(only: %i[id block_type title subtitle url position active metadata clicks_count company_id publication_id]).merge(
            type: block.block_type
          )
        end

        def profile_payload(profile)
          {
            public_slug: profile.public_slug,
            creator_enabled: profile.creator_enabled,
            tree_views_count: profile.tree_views_count
          }
        end
      end
    end
  end
end