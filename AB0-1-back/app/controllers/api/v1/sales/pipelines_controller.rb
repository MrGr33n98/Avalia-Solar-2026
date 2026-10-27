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

        def create
          name = params.dig(:pipeline, :name).to_s.strip
          if name.blank?
            return render_error_response(
              message: 'Nome do funil / pipeline é obrigatório.',
              status: :unprocessable_entity,
              code: 'PIPELINE_NAME_REQUIRED'
            )
          end

          raw_key = params.dig(:pipeline, :key).presence || name.parameterize.underscore
          key = raw_key
          counter = 1
          while ::Sales::Pipeline.exists?(key: key)
            key = "#{raw_key}_#{counter}"
            counter += 1
          end

          pipeline = ::Sales::Pipeline.new(
            name: name,
            key: key,
            active: params.dig(:pipeline, :active).nil? ? true : params.dig(:pipeline, :active)
          )

          ActiveRecord::Base.transaction do
            pipeline.save!
            stages_input = params.dig(:pipeline, :stages)
            if stages_input.present? && stages_input.is_a?(Array)
              stages_input.each_with_index do |s, idx|
                stage_name = s[:name].to_s.strip
                next if stage_name.blank?

                s_key = s[:key].presence || stage_name.parameterize.underscore
                pipeline.stages.create!(
                  name: stage_name,
                  key: s_key,
                  position: s[:position].presence || (idx + 1),
                  probability: s[:probability].to_i,
                  terminal_type: s[:terminal_type].presence
                )
              end
            elsif key.include?('onboard')
              ensure_onboarding_stages!(pipeline)
            else
              ensure_default_stages!(pipeline)
            end
          end

          render json: { pipeline: pipeline_json(pipeline.reload) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'PIPELINE_INVALID')
        rescue StandardError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'PIPELINE_CREATE_FAILED')
        end

        def update
          pipeline = ::Sales::Pipeline.includes(:stages).find(params[:id])
          if params[:pipeline][:name].present?
            pipeline.name = params[:pipeline][:name].to_s.strip
          end
          if params[:pipeline].key?(:active)
            pipeline.active = params[:pipeline][:active]
          end
          pipeline.save!

          render json: { pipeline: pipeline_json(pipeline) }
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Pipeline não encontrado', status: :not_found, code: 'PIPELINE_NOT_FOUND')
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'PIPELINE_INVALID')
        end

        private

        def ensure_onboarding_stages!(pipeline)
          onboarding_stages = [
            ['kickoff', 'Boas-vindas & Kickoff', 15, nil],
            ['document_collection', 'Coleta de Documentação', 35, nil],
            ['engineering_review', 'Engenharia & Homologação', 60, nil],
            ['implementation', 'Instalação & Configuração', 80, nil],
            ['training_golive', 'Treinamento & Go-Live', 95, nil],
            ['completed', 'Onboarding Concluído', 100, 'won'],
            ['churned', 'Cancelado / Desistência', 0, 'lost']
          ]
          onboarding_stages.each_with_index do |(key, name, probability, terminal), position|
            pipeline.stages.create!(
              key: key,
              name: name,
              position: position + 1,
              probability: probability,
              terminal_type: terminal
            )
          end
        end

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
