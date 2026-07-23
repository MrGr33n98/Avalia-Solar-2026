# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class ContentAnalyticsController < BaseController
        before_action -> { require_company_feature!('content_intent_analytics') }
        def overview
          authorize @company, :view_analytics?
          range = reporting_range
          downloads = @company.material_downloads.where(created_at: range)
          delivered = downloads.delivered
          leads = downloads.where.not(content_lead_id: nil).distinct.count(:content_lead_id)
          events = AnalyticsEvent.where(company_id: @company.id, tracked_at: range)

          render json: {
            period: { from: range.begin.to_date, to: range.end.to_date },
            metrics: {
              material_views: events.where(event_type: 'material_list_viewed').count,
              download_clicks: events.where(event_type: 'material_download_clicked').count,
              gate_views: events.where(event_type: 'material_gate_viewed').count,
              form_submissions: events.where(event_type: 'material_form_submitted').count,
              authorizations: downloads.count,
              delivered_downloads: delivered.count,
              unique_leads: leads,
              delivery_rate: downloads.exists? ? ((delivered.count.to_f / downloads.count) * 100).round(2) : 0
            },
            assets: @company.company_materials.order(download_count: :desc).limit(10).map do |material|
              material_downloads = downloads.where(company_material_id: material.id)
              { id: material.id, title: material.title, authorizations: material_downloads.count, delivered_downloads: material_downloads.delivered.count, unique_leads: material_downloads.where.not(content_lead_id: nil).distinct.count(:content_lead_id) }
            end,
            data_freshness: { source: 'transactional_database', updated_at: Time.current }
          }
        end

        def funnel
          authorize @company, :view_analytics?
          downloads = @company.material_downloads.where(created_at: reporting_range)
          authorizations = downloads.count
          delivered = downloads.delivered.count
          render json: {
            stages: [
              { key: 'material_download_authorized', label: 'Downloads autorizados', value: authorizations },
              { key: 'material_download_delivered', label: 'Downloads entregues', value: delivered, conversion_from_previous: authorizations.positive? ? ((delivered.to_f / authorizations) * 100).round(2) : 0 },
              { key: 'content_leads', label: 'Leads únicos', value: downloads.where.not(content_lead_id: nil).distinct.count(:content_lead_id) }
            ],
            data_freshness: { source: 'transactional_database', updated_at: Time.current }
          }
        end

        def timeseries
          authorize @company, :view_analytics?
          days = normalized_days
          downloads = @company.material_downloads.where(created_at: reporting_range(days))
          authorizations_by_day = downloads.group("DATE(created_at)").count
          delivered_by_day = downloads.delivered.group("DATE(created_at)").count
          data = (days - 1).downto(0).map do |offset|
            date = offset.days.ago.to_date
            { date: date, authorizations: authorizations_by_day[date] || authorizations_by_day[date.to_s] || 0, delivered_downloads: delivered_by_day[date] || delivered_by_day[date.to_s] || 0 }
          end
          render json: { data: data, data_freshness: { source: 'transactional_database', updated_at: Time.current } }
        end

        private

        def reporting_range
          days = normalized_days
          reporting_range(days)
        end

        def reporting_range(days)
          days.days.ago.beginning_of_day..Time.current
        end

        def normalized_days
          days = params[:days].to_i
          days.between?(1, 365) ? days : 30
        end
      end
    end
  end
end
