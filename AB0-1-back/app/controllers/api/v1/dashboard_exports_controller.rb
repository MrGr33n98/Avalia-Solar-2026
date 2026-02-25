# frozen_string_literal: true

module Api
  module V1
    class DashboardExportsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_company
      before_action :authorize_export

      def events
        from, to = parse_range
        csv = Analytics::ExportService.new(company: @company, from: from, to: to, kind: :events).call
        send_data csv, filename: "analytics_events_#{@company.id}_#{from.to_date}_#{to.to_date}.csv"
      end

      def daily_stats
        from, to = parse_range
        csv = Analytics::ExportService.new(company: @company, from: from, to: to, kind: :daily_stats).call
        send_data csv, filename: "company_daily_stats_#{@company.id}_#{from.to_date}_#{to.to_date}.csv"
      end

      # Backward-compatible single endpoint: /api/v1/dashboard/export?company_id=...&kind=events|daily_stats
      def export
        kind = params[:kind].presence_in(%w[events daily_stats]) || 'events'
        from, to = parse_range
        csv = Analytics::ExportService.new(company: @company, from: from, to: to, kind: kind.to_sym).call
        name = kind == 'events' ? 'analytics_events' : 'company_daily_stats'
        send_data csv, filename: "#{name}_#{@company.id}_#{from.to_date}_#{to.to_date}.csv"
      end

      private

      def set_company
        @company = Company.find(params[:company_id])
      end

      def authorize_export
        authorize @company, :export?, policy_class: DashboardPolicy
      end

      def parse_range
        from = begin
          Time.zone.parse(params[:from])
        rescue StandardError
          30.days.ago
        end
        to = begin
          Time.zone.parse(params[:to])
        rescue StandardError
          Time.current
        end
        [from, to]
      end
    end
  end
end
