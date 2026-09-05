# frozen_string_literal: true

module Api
  module V1
    module Sales
      class CampaignsController < BaseController
        before_action :authenticate_api_user
        before_action :set_campaign, only: %i[show update destroy snapshot preflight dispatch pause resume cancel retry_failed analytics]

        def preflight
          result = ::Sales::Campaigns::Preflight.call(campaign: @campaign)
          render json: { campaign_id: @campaign.id, preflight: result }
        end

        def cancel
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'cancel')
          render json: { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
        end

        def index
          scope = scoped_campaigns.order(created_at: :desc)
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
          company = current_user.company || (current_user.admin? && params[:campaign] && params[:campaign][:company_id].present? ? Company.find_by(id: params[:campaign][:company_id]) : nil)
          unless company
            render json: { errors: ['Empresa (tenant) inválida ou não autorizada.'] }, status: :forbidden
            return
          end

          campaign = ::Sales::Campaign.new(campaign_params.merge(
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
          if @campaign.update(campaign_params)
            render json: { campaign: serialize_campaign_summary(@campaign) }
          else
            render json: { errors: @campaign.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @campaign.destroy!
          render json: { message: 'Campanha excluída com sucesso.' }
        end

        def snapshot
          result = ::Sales::Campaigns::SnapshotService.call(campaign: @campaign)
          render json: { campaign: serialize_campaign_summary(@campaign.reload), snapshot: result }
        end

        def dispatch
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'dispatch')
          render json: { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
        end

        def pause
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'pause')
          render json: { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
        end

        def resume
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'resume')
          render json: { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
        end

        def retry_failed
          result = ::Sales::Campaigns::Dispatcher.call(campaign: @campaign, action: 'retry_failed')
          render json: { campaign: serialize_campaign_summary(@campaign.reload), dispatch: result }
        end

        def analytics
          metrics = ::Sales::Campaigns::MetricsCalculator.calculate(@campaign)
          render json: { campaign_id: @campaign.id, metrics: metrics }
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
            :scheduled_at, :active, audience_filter: {}
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
