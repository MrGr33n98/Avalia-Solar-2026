# frozen_string_literal: true

module Api
  module V1
    module Sales
      class OpportunitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity, only: %i[show update timeline]

        def index
          scope = scoped_opportunities.merge(::Sales::OpportunitiesQuery.call(params)).includes(:account, :stage, :primary_contact, :owner)
          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 50].max, 100].min
          total = scope.count
          opportunities = scope.offset((page - 1) * per_page).limit(per_page)
          totals = scope.unscope(:select, :order, :limit, :offset).pick(
            Arel.sql('COALESCE(SUM(sales_opportunities.value_cents), 0)'),
            Arel.sql('COUNT(sales_opportunities.id)')
          )
          render json: {
            opportunities: opportunities.map { |o| opportunity_json(o) },
            meta: { page: page, per_page: per_page, total: total, pages: (total.to_f / per_page).ceil },
            totals: { value_cents: totals&.first.to_i, count: totals&.last.to_i }
          }
        end

        def show
          render json: { opportunity: opportunity_json(@opportunity) }
        end

        def bulk
          ids = Array(params[:ids]).filter_map { |id| Integer(id, exception: false) }.uniq
          return render_error_response(message: 'Selecione ao menos um Lead.', status: :unprocessable_entity, code: 'BULK_EMPTY') if ids.empty?
          return render_error_response(message: 'Limite de 100 Leads por operação.', status: :unprocessable_entity, code: 'BULK_LIMIT') if ids.size > 100

          updated = ActiveRecord::Base.transaction do
            records = scoped_opportunities.includes(pipeline: :stages).where(id: ids).lock.to_a
            raise ActiveRecord::RecordNotFound if records.size != ids.size
            records.each { |record| apply_bulk_action(record) }
            records
          end
          render json: { updated_ids: updated.map(&:id), count: updated.size }
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Lead não encontrado ou sem permissão.', status: :not_found, code: 'LEAD_NOT_FOUND')
        rescue ActiveRecord::RecordInvalid, ArgumentError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'BULK_INVALID')
        end

        def timeline
          events = []

          # 1. Stage histories
          @opportunity.stage_histories.includes(:to_stage, :actor).each do |sh|
            events << {
              id: "sh-#{sh.id}",
              type: 'stage_changed',
              title: "Estágio alterado para #{sh.to_stage&.name || 'Novo Estágio'}",
              description: sh.actor ? "Alterado por #{sh.actor.name rescue 'Usuário'}" : nil,
              occurred_at: sh.entered_at || sh.created_at
            }
          end

          # 2. Activities
          ::Sales::Activity.where(sales_opportunity_id: @opportunity.id).find_each do |act|
            events << {
              id: "act-#{act.id}",
              type: act.activity_type == 'call' ? 'call' : 'activity',
              title: act.activity_type == 'call' ? 'Chamada Telefônica Registrada' : 'Atividade Comercial',
              description: act.description,
              occurred_at: act.occurred_at || act.created_at
            }
          end

          # 3. Tasks
          ::Sales::Task.where(sales_opportunity_id: @opportunity.id).find_each do |t|
            events << {
              id: "task-#{t.id}",
              type: 'task',
              title: "Tarefa: #{t.title}",
              description: "Status: #{t.status} | Prioridade: #{t.priority}",
              occurred_at: t.created_at
            }
          end

          # 4. Notes
          ::Sales::Note.where(opportunity_id: @opportunity.id).find_each do |n|
            events << {
              id: "note-#{n.id}",
              type: 'note',
              title: 'Anotação Interna',
              description: n.body,
              occurred_at: n.created_at
            }
          end

          # 5. Email messages
          ::Sales::EmailMessage.where(sales_opportunity_id: @opportunity.id).find_each do |em|
            events << {
              id: "email-#{em.id}",
              type: 'email',
              title: "E-mail: #{em.subject}",
              description: "Para: #{em.to_email} | Status: #{em.status}",
              occurred_at: em.sent_at || em.created_at
            }
          end

          # 6. Quotes
          ::Sales::Quote.where(opportunity_id: @opportunity.id).find_each do |q|
            events << {
              id: "quote-#{q.id}",
              type: 'quote',
              title: "Proposta Comercial ##{q.number}",
              description: "Status: #{q.status} | Potência: #{q.system_size_kwp || '—'} kWp",
              occurred_at: q.created_at
            }
          end

          # 7. Opportunity creation
          events << {
            id: "opp-create-#{@opportunity.id}",
            type: 'website',
            title: 'Oportunidade Criada no CRM',
            description: "Oportunidade #{@opportunity.name} iniciada.",
            occurred_at: @opportunity.created_at
          }

          events.sort_by! { |e| e[:occurred_at] || Time.current }.reverse!

          render json: { timeline: events }
        end

        def create
          result = ::Sales::Opportunities::Create.call(
            actor: current_user,
            attributes: opportunity_create_params.merge(stage_key: params.dig(:opportunity, :stage_key)),
            inline_account: params[:account] || params.dig(:opportunity, :account),
            inline_contact: params[:contact] || params.dig(:opportunity, :contact)
          )

          if result.success?
            render json: { opportunity: opportunity_json(result.opportunity) }, status: :created
          else
            render json: {
              error: {
                code: result.code,
                message: result.message,
                fields: result.fields,
                request_id: request.request_id
              }
            }, status: :unprocessable_entity
          end
        end

        def update
          ActiveRecord::Base.transaction do
            if params.dig(:opportunity, :stage_key).present? || params.dig(:opportunity, :sales_stage_id).present?
              stage = if params.dig(:opportunity, :stage_key).present?
                        @opportunity.pipeline.stages.find_by(key: params[:opportunity][:stage_key]) ||
                          @opportunity.pipeline.stages.find_by(name: params[:opportunity][:stage_key])
                      else
                        ::Sales::Stage.find_by(id: params[:opportunity][:sales_stage_id])
                      end
              stage ||= @opportunity.pipeline.stages.order(:position).first
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

        def scoped_opportunities
          return ::Sales::Opportunity.all if current_user.admin?
          ::Sales::Opportunity.joins(:account).where(sales_accounts: { company_id: current_user.company_id })
        end

        def apply_bulk_action(record)
          case params[:action].to_s
          when 'status'
            record.update!(status: params[:value].to_s)
          when 'owner'
            record.update!(owner_id: Integer(params[:value]))
          when 'remove_tag'
            tag_scope = current_user.admin? ? ::Sales::Tag.all : ::Sales::Tag.where(company_id: current_user.company_id)
            tag = tag_scope.find(params[:value])
            raise ActiveRecord::RecordNotFound unless tag.entity_type == 'Opportunity'
            record.taggings.where(sales_tag_id: tag.id).delete_all
          when 'tag'
            tag_scope = current_user.admin? ? ::Sales::Tag.all : ::Sales::Tag.where(company_id: current_user.company_id)
            tag = tag_scope.active.find(params[:value])
            raise ActiveRecord::RecordNotFound unless tag.entity_type == 'Opportunity'
            record.taggings.create_or_find_by!(sales_tag_id: tag.id, created_by: current_user)
          when 'stage'
            stage = record.pipeline.stages.to_a.find { |candidate| candidate.id == Integer(params[:value], exception: false) || candidate.key == params[:value].to_s }
            raise ActiveRecord::RecordNotFound if stage.nil?
            ::Sales::Opportunities::ChangeStage.call(opportunity: record, stage: stage, actor: current_user)
          else
            raise ArgumentError, 'Ação em massa inválida.'
          end
        end

        def set_opportunity
          @opportunity = scoped_opportunities.includes(:account, :stage, :primary_contact, :pipeline).find(params[:id])
        end

        def resolve_pipeline
          pipeline = if params.dig(:opportunity, :sales_pipeline_id).present?
                       ::Sales::Pipeline.find_by(id: params[:opportunity][:sales_pipeline_id])
                     end
          pipeline ||= ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first

          if pipeline.nil?
            pipeline = ::Sales::Pipeline.create!(name: 'Avalia Solar B2B Sales', key: 'b2b_sales', active: true)
          end

          ensure_default_stages!(pipeline) if pipeline.stages.empty?
          pipeline
        end

        def resolve_stage(pipeline)
          stage_key = params.dig(:opportunity, :stage_key).presence
          stage_id = params.dig(:opportunity, :sales_stage_id).presence || params.dig(:opportunity, :stage_id).presence

          stage = if stage_key.present?
                    pipeline.stages.find_by(key: stage_key) || pipeline.stages.find_by(name: stage_key)
                  elsif stage_id.present?
                    pipeline.stages.find_by(id: stage_id) || ::Sales::Stage.find_by(id: stage_id)
                  end

          stage ||= pipeline.stages.order(:position).first
          stage ||= ::Sales::Stage.order(:position).first

          raise ActiveRecord::RecordNotFound, "Nenhum estágio encontrado para o pipeline '#{pipeline.name}'" if stage.nil?

          stage
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

        def opportunity_create_params
          params.require(:opportunity).permit(
            :sales_account_id, :primary_contact_id,
            :sales_pipeline_id, :sales_stage_id, :stage_key,
            :name, :value_cents, :currency, :probability, :probability_overridden,
            :priority, :source, :expected_close_date, :next_activity_at, :status
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
            stage_entered_at: opportunity.stage_entered_at || opportunity.created_at,
            source: opportunity.source,
            sales_account_id: opportunity.sales_account_id,
            sales_pipeline_id: opportunity.sales_pipeline_id,
            account: opportunity.account ? { id: opportunity.account.id, name: opportunity.account.name } : nil,
            stage: opportunity.stage ? { id: opportunity.stage.id, key: opportunity.stage.key, name: opportunity.stage.name } : nil,
            contact_id: contact&.id,
            contact_name: contact ? [contact.first_name, contact.last_name].compact.join(' ') : nil,
            contact_email: contact&.email,
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
