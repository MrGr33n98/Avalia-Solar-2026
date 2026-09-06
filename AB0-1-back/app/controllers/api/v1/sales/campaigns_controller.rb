# frozen_string_literal: true

module Api
  module V1
    module Sales
      class CampaignsController < BaseController
        before_action :authenticate_api_user
        before_action :set_campaign, only: %i[show update destroy snapshot schedule preflight launch pause resume cancel retry_failed analytics recipients activity]

        def preflight
          authorize @campaign
          result = ::Sales::Campaigns::Preflight.call(campaign: @campaign)
          status = result[:ready] ? :ok : :unprocessable_entity
          render json: { campaign_id: @campaign.id, preflight: result }, status: status
        end

        def cancel
          authorize @campaign
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'cancel')
          payload = { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
          if result[:error]
            render json: payload, status: :unprocessable_entity
          else
            render json: payload
          end
        end

        def index
          authorize ::Sales::Campaign
          scope = scoped_campaigns.includes(:email_template).order(created_at: :desc)
          scope = scope.where(status: params[:status]) if params[:status].present? && ::Sales::Campaign.column_names.include?('status')
          scope = scope.where(campaign_type: params[:campaign_type]) if params[:campaign_type].present? && ::Sales::Campaign.column_names.include?('campaign_type')
          if params[:q].present?
            term = "%#{params[:q].to_s.downcase}%"
            if ::Sales::Campaign.column_names.include?('campaign_key')
              scope = scope.where('LOWER(name) LIKE :term OR LOWER(campaign_key) LIKE :term', term: term)
            else
              scope = scope.where('LOWER(name) LIKE :term', term: term)
            end
          end

          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 1].max, 100].min
          total_count = scope.count
          campaigns = scope.offset((page - 1) * per_page).limit(per_page)

          serialized = campaigns.map { |c| serialize_campaign_summary(c) }

          render json: {
            campaigns: serialized,
            meta: {
              page: page,
              per_page: per_page,
              total_count: total_count,
              total_pages: (total_count.to_f / per_page).ceil
            }
          }
        end

        def show
          authorize @campaign
          metrics = ::Sales::Campaigns::MetricsCalculator.calculate(@campaign)
          recent_recipients = @campaign.recipients.order(updated_at: :desc).limit(50).map do |r|
            {
              id: r.id,
              email: r.email,
              first_name: r.first_name,
              status: r.status,
              error_message: r.error_message,
              sent_at: r.sent_at,
              delivered_at: r.delivered_at,
              opened_at: r.opened_at,
              clicked_at: r.clicked_at
            }
          end

          render json: {
            campaign: serialize_campaign_detailed(@campaign),
            metrics: metrics,
            recipients: recent_recipients
          }
        end

        def create
          authorize ::Sales::Campaign
          company = (current_user.respond_to?(:company) ? current_user.company : nil) ||
                    (current_user.respond_to?(:company_id) && current_user.company_id.present? ? ::Company.find_by(id: current_user.company_id) : nil) ||
                    (current_user.respond_to?(:admin?) && current_user.admin? && params[:campaign] && params[:campaign][:company_id].present? ? ::Company.find_by(id: params[:campaign][:company_id]) : nil)
          unless company
            render json: { errors: ['Empresa (tenant) inválida ou não autorizada.'] }, status: :forbidden
            return
          end

          attributes = campaign_params.to_h
          audience = attributes[:audience_id].present? ? ::Sales::Audience.find_by(id: attributes[:audience_id], company_id: company.id, active: true) : nil
          if attributes[:audience_id].present? && audience.nil?
            render json: { errors: ['Audiência inválida ou não autorizada.'] }, status: :unprocessable_entity
            return
          end
          attributes[:audience_filter] = audience.filter_definition if audience
          campaign = ::Sales::Campaign.new(attributes.merge(
            company_id: company.id,
            user_id: current_user.id,
            status: 'draft'
          ))

          if campaign.save
            render json: { campaign: serialize_campaign_summary(campaign) }, status: :created
          else
            render json: { errors: campaign.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          authorize @campaign
          attributes = campaign_params.to_h
          is_structural = attributes.key?(:audience_id) || attributes.key?(:audience_filter) || attributes.key?(:email_template_id)

          if is_structural && !@campaign.draft?
            render json: {
              error: 'CAMPAIGN_NOT_EDITABLE',
              message: 'Alterações estruturais (audiência ou template) só são permitidas quando a campanha está em rascunho (draft).',
              details: {
                blockers: [
                  { code: 'CAMPAIGN_NOT_EDITABLE', message: "Campanha no estado '#{@campaign.status}' não permite alteração estrutural." }
                ]
              }
            }, status: :conflict
            return
          end

          updated_successfully = false
          invalid_audience = false

          @campaign.with_lock do
            @campaign.reload
            if is_structural && !@campaign.draft?
              render json: {
                error: 'CAMPAIGN_NOT_EDITABLE',
                message: 'Alterações estruturais (audiência ou template) só são permitidas quando a campanha está em rascunho (draft).',
                details: {
                  blockers: [
                    { code: 'CAMPAIGN_NOT_EDITABLE', message: "Campanha no estado '#{@campaign.status}' não permite alteração estrutural." }
                  ]
                }
              }, status: :conflict
              return
            end

            if attributes.key?(:audience_id)
              audience = ::Sales::Audience.find_by(id: attributes[:audience_id], company_id: @campaign.company_id, active: true)
              if attributes[:audience_id].present? && audience.nil?
                invalid_audience = true
                next
              end
              attributes[:audience_filter] = audience&.filter_definition || {} if attributes[:audience_id].present?
            end

            @campaign.assign_attributes(attributes)
            unless @campaign.valid?
              next
            end

            if is_structural
              @campaign.recipients.delete_all
              @campaign.template_snapshot = nil
              @campaign.template_snapshot_at = nil
              @campaign.total_recipients = 0
            end

            @campaign.save!
            updated_successfully = true
          end

          if invalid_audience
            render json: { error: 'INVALID_AUDIENCE', message: 'Audiência inválida ou não autorizada.', details: { blockers: [{ code: 'INVALID_AUDIENCE', message: 'Audiência não encontrada.' }] } }, status: :unprocessable_entity
          elsif updated_successfully
            render json: { campaign: serialize_campaign_summary(@campaign.reload) }
          else
            render json: { error: 'VALIDATION_FAILED', message: @campaign.errors.full_messages.join(', '), details: { blockers: @campaign.errors.full_messages.map { |m| { code: 'VALIDATION_ERROR', message: m } } } }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @campaign
          @campaign.destroy!
          render json: { message: 'Campanha excluída com sucesso.' }
        end

        def snapshot
          authorize @campaign
          result = ::Sales::Campaigns::SnapshotService.call(campaign: @campaign)
          payload = { campaign: serialize_campaign_summary(@campaign.reload), snapshot: result }
          if result.is_a?(Hash) && result[:error]
            render json: payload, status: :unprocessable_entity
          else
            render json: payload
          end
        rescue ::Sales::Campaigns::SnapshotService::EmptyAudienceError => e
          render json: { error: 'EMPTY_AUDIENCE', message: e.message, details: { blockers: [{ code: 'EMPTY_AUDIENCE', message: e.message }] } }, status: :unprocessable_entity
        rescue ::Sales::Campaigns::SnapshotService::SnapshotError => e
          render json: { error: 'SNAPSHOT_FAILED', message: e.message, details: { blockers: [{ code: 'SNAPSHOT_FAILED', message: e.message }] } }, status: :unprocessable_entity
        end

        def schedule
          authorize @campaign
          scheduled_at_param = params[:scheduled_at] || campaign_params[:scheduled_at]
          if scheduled_at_param.blank?
            render json: { error: 'MISSING_SCHEDULED_AT', message: 'Data e hora de agendamento são obrigatórias.' }, status: :unprocessable_entity
            return
          end

          parsed_time = begin
            Time.zone.parse(scheduled_at_param.to_s)
          rescue StandardError
            nil
          end

          if parsed_time.nil? || parsed_time <= Time.current
            render json: { error: 'INVALID_SCHEDULED_AT', message: 'A data de agendamento deve ser uma data futura válida.' }, status: :unprocessable_entity
            return
          end

          schedule_success = false
          schedule_error = nil

          @campaign.with_lock do
            @campaign.reload
            unless @campaign.can_schedule?
              schedule_error = { error: 'CAMPAIGN_NOT_SCHEDULEABLE', message: "Campanha em estado '#{@campaign.status}' não pode ser agendada." }
              next
            end

            preflight = ::Sales::Campaigns::Preflight.call(campaign: @campaign)
            unless preflight[:ready]
              schedule_error = { campaign_id: @campaign.id, preflight: preflight, error: 'PREFLIGHT_FAILED', message: 'A campanha não passou no preflight.' }
              next
            end

            if @campaign.recipients.empty?
              ::Sales::Campaigns::SnapshotService.call(campaign: @campaign)
            end

            @campaign.update!(status: 'scheduled', scheduled_at: parsed_time)
            schedule_success = true
          end

          if schedule_error
            status_code = schedule_error[:error] == 'CAMPAIGN_NOT_SCHEDULEABLE' ? :conflict : :unprocessable_entity
            render json: schedule_error, status: status_code
          else
            render json: { campaign: serialize_campaign_summary(@campaign.reload) }
          end
        rescue ::Sales::Campaigns::SnapshotService::SnapshotError => e
          render json: { error: 'SNAPSHOT_FAILED', message: e.message, details: { blockers: [{ code: 'SNAPSHOT_FAILED', message: e.message }] } }, status: :unprocessable_entity
        end

        def launch
          authorize @campaign
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'dispatch')
          payload = { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
          if result[:error]
            render json: payload, status: :unprocessable_entity
          else
            render json: payload
          end
        end

        def pause
          authorize @campaign
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'pause')
          payload = { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
          if result[:error]
            render json: payload, status: :unprocessable_entity
          else
            render json: payload
          end
        end

        def resume
          authorize @campaign
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'resume')
          payload = { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
          if result[:error]
            render json: payload, status: :unprocessable_entity
          else
            render json: payload
          end
        end

        def retry_failed
          authorize @campaign
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'retry_failed')
          payload = { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
          if result[:error]
            render json: payload, status: :unprocessable_entity
          else
            render json: payload
          end
        end

        def analytics
          authorize @campaign
          metrics = ::Sales::Campaigns::MetricsCalculator.calculate(@campaign)
          render json: { campaign_id: @campaign.id, metrics: metrics }
        end

        def activity
          authorize @campaign
          messages = @campaign.email_messages.includes(:events).order(created_at: :desc).limit(100)
          rows = messages.flat_map do |message|
            message.events.map do |event|
              { id: event.id, type: event.event_type, occurred_at: event.occurred_at, provider_event_id: event.provider_event_id,
                recipient_id: message.sales_campaign_recipient_id }
            end
          end.sort_by { |row| row[:occurred_at] || Time.at(0) }.reverse
          render json: { campaign_id: @campaign.id, activity: rows }
        end

        def recipients
          authorize @campaign
          scope = @campaign.recipients.order(updated_at: :desc)
          scope = scope.where(status: params[:status]) if params[:status].present?
          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
          total_count = scope.count
          rows = scope.offset((page - 1) * per_page).limit(per_page).map { |r| serialize_recipient(r) }
          render json: { recipients: rows, meta: { page: page, per_page: per_page, total_count: total_count, total_pages: (total_count.to_f / per_page).ceil } }
        end

        private

        def set_campaign
          @campaign = scoped_campaigns.find(params[:id])
        end

        def scoped_campaigns
          return ::Sales::Campaign.none if current_user.nil?
          return ::Sales::Campaign.all if current_user.respond_to?(:admin?) && current_user.admin?

          if current_user.respond_to?(:company_id) && current_user.company_id.present?
            ::Sales::Campaign.where(company_id: current_user.company_id)
          elsif current_user.respond_to?(:id) && current_user.id.present? && ::Sales::Campaign.column_names.include?('user_id')
            ::Sales::Campaign.where(user_id: current_user.id)
          else
            ::Sales::Campaign.none
          end
        end

        def campaign_params
          params.require(:campaign).permit(
            :name, :campaign_key, :campaign_type, :email_template_id,
            :scheduled_at, :active, :audience_id, audience_filter: {}
          )
        end

        def serialize_campaign_summary(c)
          {
            id: c.id,
            name: c.name,
            campaign_key: c.try(:campaign_key),
            campaign_type: c.try(:campaign_type) || 'email_broadcast',
            status: c.try(:status) || 'draft',
            active: c.try(:active).nil? ? true : c.active,
            total_recipients: c.try(:total_recipients).to_i,
            processed_recipients: c.try(:processed_recipients).to_i,
            sent_count: c.try(:sent_count).to_i,
            delivered_count: c.try(:delivered_count).to_i,
            opened_count: c.try(:opened_count).to_i,
            clicked_count: c.try(:clicked_count).to_i,
            bounced_count: c.try(:bounced_count).to_i,
            unsubscribed_count: c.try(:unsubscribed_count).to_i,
            revenue_attributed_cents: c.try(:revenue_attributed_cents).to_i,
            scheduled_at: c.try(:scheduled_at),
            started_at: c.try(:started_at),
            completed_at: c.try(:completed_at),
            email_template_id: c.try(:email_template_id),
            template_name: c.respond_to?(:email_template) ? c.email_template&.name : nil,
            created_at: c.created_at,
            updated_at: c.updated_at
          }
        end

        def serialize_recipient(r)
          { id: r.id, email: r.email, first_name: r.first_name, status: r.status, error_message: r.error_message,
            sent_at: r.sent_at, delivered_at: r.delivered_at, opened_at: r.opened_at, clicked_at: r.clicked_at }
        end

        def serialize_campaign_detailed(c)
          serialize_campaign_summary(c).merge(
            audience_filter: c.try(:audience_filter) || {},
            user_name: c.try(:user)&.name || 'Sistema'
          )
        end
      end
    end
  end
end
