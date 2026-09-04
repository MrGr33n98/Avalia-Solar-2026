# frozen_string_literal: true

module Api
  module V1
    module Sales
      class LeadsController < BaseController
        def index
          scope = ::Sales::LeadsQuery.call(params, scoped_opportunities)
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
            actor: current_user,
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
          lead = scoped_opportunities.find(params[:id])
          render json: { lead: serialize_lead(lead), opportunity: serialize_lead(lead) }
        end

        def update
          lead = scoped_opportunities.find(params[:id])
          lead_params = params[:lead] || params[:opportunity] || params

          if lead.update(lead_params.permit(:name, :value_cents, :temperature, :sales_stage_id, :stage_key, :expected_close_date, :probability))
            render json: { lead: serialize_lead(lead), opportunity: serialize_lead(lead) }
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: lead.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def convert
          lead = scoped_opportunities.find(params[:id])
          result = ::Sales::LeadConversionService.call(
            opportunity: lead,
            actor: current_user,
            stage_id: params[:sales_stage_id] || params[:stage_id]
          )

          render json: {
            lead: serialize_lead(result[:opportunity]),
            account: { id: result[:account].id, name: result[:account].name },
            contact: { id: result[:contact].id, name: [result[:contact].first_name, result[:contact].last_name].compact.join(' ') }
          }, status: :ok
        end

        def bulk
          action = params[:bulk_action].presence || params[:action_type].presence
          supported_actions = %w[assign_owner change_stage stage change_status status change_temperature temperature add_tag remove_tag archive delete]

          unless supported_actions.include?(action.to_s)
            return render json: {
              error: {
                code: 'INVALID_BULK_ACTION',
                message: "Ação em massa '#{action}' não é suportada."
              }
            }, status: :unprocessable_entity
          end

          raw_ids = Array(params[:ids] || params[:lead_ids])
          ids = raw_ids.take(100) # Max batch 100
          records = scoped_opportunities.where(id: ids)
          matched_count = records.count
          updated_count = 0
          failed_count = 0
          failures = []

          records.each do |lead|
            begin
              case action.to_s
              when 'change_stage', 'stage'
                target_stage = lead.pipeline.stages.find_by(id: params[:value]) || lead.pipeline.stages.find_by(key: params[:value])
                if target_stage
                  ::Sales::StageTransition.call(opportunity: lead, to_stage: target_stage, actor: current_user)
                  updated_count += 1
                else
                  failed_count += 1
                  failures << { id: lead.id, error: 'Estágio inválido para o pipeline' }
                end

              when 'change_status', 'status'
                lead.update!(status: params[:value].to_s)
                updated_count += 1

              when 'change_temperature', 'temperature'
                lead.update!(temperature: params[:value].to_s)
                updated_count += 1

              when 'assign_owner'
                target_owner = User.find_by(id: params[:value])
                if target_owner
                  lead.update!(owner: target_owner)
                  updated_count += 1
                else
                  failed_count += 1
                  failures << { id: lead.id, error: 'Vendedor responsável não encontrado' }
                end

              when 'archive', 'delete'
                lead.update!(status: 'archived')
                updated_count += 1
              end
            rescue => e
              failed_count += 1
              failures << { id: lead.id, error: e.message }
            end
          end

          render json: {
            requested_count: raw_ids.length,
            matched_count: matched_count,
            updated_count: updated_count,
            failed_count: failed_count,
            failures: failures
          }, status: :ok
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
        def scoped_opportunities
          ::Sales::TenantScope.for(current_user).opportunities
        end
      end
    end
  end
end
