# frozen_string_literal: true

module Api
  module V1
    module Sales
      class PipelinesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          pipelines = ::Sales::Pipeline.includes(:stages).where(active: true)
          pipelines = ::Sales::Pipeline.includes(:stages).all if pipelines.empty?

          render json: {
            pipelines: pipelines.map { |p| pipeline_json(p) }
          }
        end

        def show
          pipeline = ::Sales::Pipeline.includes(:stages).find(params[:id])
          render json: { pipeline: pipeline_json(pipeline) }
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Pipeline não encontrado', status: :not_found, code: 'PIPELINE_NOT_FOUND')
        end

        private

        def pipeline_json(pipeline)
          {
            id: pipeline.id,
            name: pipeline.name,
            key: pipeline.key,
            active: pipeline.active,
            stages: pipeline.stages.order(:position).map do |s|
              {
                id: s.id,
                name: s.name,
                key: s.key,
                position: s.position,
                probability: s.probability
              }
            end
          }
        end
      end
    end
  end
end
