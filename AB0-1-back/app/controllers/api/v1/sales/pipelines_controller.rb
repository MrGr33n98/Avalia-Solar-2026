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

          if pipelines.empty?
            pipeline = ::Sales::Pipeline.create!(name: 'Avalia Solar B2B Sales', key: 'b2b_sales', active: true)
            ensure_default_stages!(pipeline)
            pipelines = [pipeline]
          end

          pipelines.each do |p|
            ensure_default_stages!(p) if p.stages.empty?
          end

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

        def ensure_default_stages!(pipeline)
          default_stages = [
            %w[prospect Prospect 10], %w[contacted Contacted 20], %w[qualified Qualified 35],
            %w[discovery Discovery 50], %w[proposal Proposal 70], %w[negotiation Negotiation 85],
            ['won', 'Closed Won', '100', 'won'], ['lost', 'Closed Lost', '0', 'lost']
          ]
          default_stages.each_with_index do |(key, name, probability, terminal), position|
            pipeline.stages.find_or_create_by!(key:) do |stage|
              stage.name = name
              stage.position = position
              stage.probability = probability.to_i
              stage.terminal_type = terminal
            end
          end
        end

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
