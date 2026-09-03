# frozen_string_literal: true

module Api
  module V1
    module Sales
      class LeadsController < BaseController
        def index
          scope = ::Sales::LeadsQuery.call(params)
          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 25].max, 100].min

          @opportunities = scope.page(page).per(per_page)

          render json: {
            leads: @opportunities.map { |opp| serialize_lead(opp) },
            opportunities: @opportunities.map { |opp| serialize_lead(opp) },
            meta: {
              current_page: @opportunities.current_page,
              total_pages: @opportunities.total_pages,
              total_count: @opportunities.total_count
            }
          }
        end

        def create
          lead_params = params[:lead] || params[:opportunity] || params
          inline_acc = params[:account]
          inline_cnt = params[:contact]

          result = ::Sales::Leads::Create.call(
            actor: current_user || User.first,
            attributes: lead_params.permit(
              :name, :sales_account_id, :primary_contact_id, :sales_pipeline_id, :sales_stage_id,
              :stage_key, :value_cents, :currency, :probability, :expected_close_date, :temperature,
              :source_id, competitor_ids: [], contact_ids: []
            ),
            inline_account: inline_acc,
            inline_contact: inline_cnt
          )

          if result.success?
            render json: { lead: serialize_lead(result.lead), opportunity: serialize_lead(result.lead) }, status: :created
          else
            render json: { error: { code: result.code, message: result.message, fields: result.fields } }, status: :unprocessable_entity
          end
        end

        def show
          lead = ::Sales::Opportunity.find(params[:id])
          render json: { lead: serialize_lead(lead), opportunity: serialize_lead(lead) }
        end

        def update
          lead = ::Sales::Opportunity.find(params[:id])
          lead_params = params[:lead] || params[:opportunity] || params

          if lead.update(lead_params.permit(:name, :value_cents, :temperature, :sales_stage_id, :stage_key, :expected_close_date, :probability))
            render json: { lead: serialize_lead(lead), opportunity: serialize_lead(lead) }
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: lead.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        private

        def serialize_lead(opp)
          {
            id: opp.id,
            name: opp.name,
            value_cents: opp.value_cents || 0,
            probability: opp.probability,
            status: opp.status,
            temperature: opp.temperature,
            stage_key: opp.stage&.key || opp.stage_key,
            sales_account_id: opp.sales_account_id,
            sales_pipeline_id: opp.sales_pipeline_id,
            primary_contact_id: opp.primary_contact_id,
            account: opp.account ? { id: opp.account.id, name: opp.account.name } : nil,
            stage: opp.stage ? { id: opp.stage.id, key: opp.stage.key, name: opp.stage.name } : nil,
            source: opp.source ? { id: opp.source.id, name: opp.source.name } : nil,
            competitors: opp.competitors.map { |c| { id: c.id, name: c.name } },
            owner_id: opp.owner_id,
            expected_close_date: opp.expected_close_date,
            created_at: opp.created_at,
            updated_at: opp.updated_at
          }
        end
      end
    end
  end
end
