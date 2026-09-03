# frozen_string_literal: true

module Api
  module V1
    module Sales
      class OpportunitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity, only: %i[show update timeline]

        def index
          scope = ::Sales::Opportunity.includes(:account, :stage, :primary_contact, :owner)

          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where(sales_account_id: params[:account_id]) if params[:account_id].present?
          scope = scope.where(owner_id: params[:owner_id]) if params[:owner_id].present?
          scope = scope.open unless params[:status].present?

          scope = scope.order(created_at: :desc).limit(500)
          render json: { opportunities: scope.map { |o| opportunity_json(o) } }
        end

        def show
          render json: { opportunity: opportunity_json(@opportunity) }
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
          ActiveRecord::Base.transaction do
            account_id = opportunity_create_params[:sales_account_id]
            if account_id.blank? && params[:account].present?
              new_account = ::Sales::Account.create!(
                name: params[:account][:name],
                domain: params[:account][:domain],
                user: current_user
              )
              account_id = new_account.id
            end

            contact_id = opportunity_create_params[:primary_contact_id]
            if contact_id.blank? && params[:contact].present? && account_id.present?
              new_contact = ::Sales::Contact.create!(
                sales_account_id: account_id,
                first_name: params[:contact][:first_name],
                email: params[:contact][:email],
                user: current_user
              )
              contact_id = new_contact.id
            end

            pipeline = resolve_pipeline
            stage = resolve_stage(pipeline)

            opportunity = ::Sales::Opportunity.new(
              opportunity_create_params.merge(
                sales_account_id: account_id,
                primary_contact_id: contact_id,
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
