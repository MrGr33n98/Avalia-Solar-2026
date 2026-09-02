# frozen_string_literal: true

module Api
  module V1
    module Sales
      class OpportunitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity, only: :update

        def index
          scope = ::Sales::Opportunity.includes(:account, :stage, :primary_contact, :owner)

          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where(sales_account_id: params[:account_id]) if params[:account_id].present?
          scope = scope.where(owner_id: params[:owner_id]) if params[:owner_id].present?
          scope = scope.open unless params[:status].present?

          scope = scope.order(created_at: :desc).limit(500)
          render json: { opportunities: scope.map { |o| opportunity_json(o) } }
        end

        def create
          ActiveRecord::Base.transaction do
            pipeline = resolve_pipeline
            stage = resolve_stage(pipeline)

            opportunity = ::Sales::Opportunity.new(
              opportunity_create_params.merge(
                owner: current_user,
                sales_pipeline: pipeline,
                sales_stage: stage,
                stage_entered_at: Time.current
              )
            )

            opportunity.probability = stage.probability unless opportunity.probability_overridden?
            opportunity.save!
            opportunity.stage_histories.create!(to_stage: stage, actor: current_user, entered_at: Time.current)
            render json: { opportunity: opportunity_json(opportunity) }, status: :created
          end
        rescue ActiveRecord::RecordNotFound => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'STAGE_NOT_FOUND')
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: {
              code: 'VALIDATION_ERROR',
              message: e.message,
              fields: e.record.errors.messages,
              request_id: request.request_id
            }
          }, status: :unprocessable_entity
        end

        def update
          ActiveRecord::Base.transaction do
            if params.dig(:opportunity, :stage_key).present? || params.dig(:opportunity, :sales_stage_id).present?
              stage = if params.dig(:opportunity, :stage_key).present?
                        @opportunity.pipeline.stages.find_by!(key: params[:opportunity][:stage_key])
                      else
                        ::Sales::Stage.find(params[:opportunity][:sales_stage_id])
                      end
              ::Sales::Opportunities::ChangeStage.call(opportunity: @opportunity, stage:, actor: current_user)
            else
              @opportunity.update!(opportunity_update_params)
            end
          end
          render json: { opportunity: opportunity_json(@opportunity.reload) }
        rescue ActiveRecord::RecordNotFound => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'STAGE_NOT_FOUND')
        rescue ArgumentError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'INVALID_STAGE_TRANSITION')
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: {
              code: 'VALIDATION_ERROR',
              message: e.message,
              fields: e.record.errors.messages
            }
          }, status: :unprocessable_entity
        end

        private

        def set_opportunity
          @opportunity = ::Sales::Opportunity.includes(:account, :stage, :primary_contact, :pipeline).find(params[:id])
        end



        def resolve_pipeline
          if params.dig(:opportunity, :sales_pipeline_id).present?
            ::Sales::Pipeline.find(params[:opportunity][:sales_pipeline_id])
          else
            ::Sales::Pipeline.find_by!(active: true)
          end
        end

        def resolve_stage(pipeline)
          key = params.dig(:opportunity, :stage_key) || 'prospect'
          stage = pipeline.stages.find_by(key:)
          raise ActiveRecord::RecordNotFound, "Estágio '#{key}' não encontrado no pipeline '#{pipeline.name}'" if stage.nil?

          stage
        end

        def opportunity_create_params
          params.require(:opportunity).permit(
            :sales_account_id, :primary_contact_id,
            :name, :value_cents, :currency, :probability, :probability_overridden,
            :priority, :source, :expected_close_date, :next_activity_at
          )
        end

        def opportunity_update_params
          params.require(:opportunity).permit(
            :sales_account_id, :primary_contact_id, :sales_stage_id,
            :name, :value_cents, :currency, :probability, :probability_overridden,
            :priority, :source, :expected_close_date, :next_activity_at, :status
          )
        end

        def opportunity_json(opportunity)
          contact = opportunity.primary_contact
          {
            id: opportunity.id,
            name: opportunity.name,
            value_cents: opportunity.value_cents,
            probability: opportunity.probability,
            status: opportunity.status,
            stage_key: opportunity.stage&.key,
            sales_account_id: opportunity.sales_account_id,
            sales_pipeline_id: opportunity.sales_pipeline_id,
            account: opportunity.account ? { id: opportunity.account.id, name: opportunity.account.name } : nil,
            stage: opportunity.stage ? { id: opportunity.stage.id, key: opportunity.stage.key, name: opportunity.stage.name } : nil,
            contact_name: contact ? [contact.first_name, contact.last_name].compact.join(' ') : nil,
            owner_id: opportunity.owner_id,
            next_activity_at: opportunity.next_activity_at,
            expected_close_date: opportunity.expected_close_date,
            priority: opportunity.priority,
            created_at: opportunity.created_at,
            updated_at: opportunity.updated_at
          }
        end
      end
    end
  end
end
