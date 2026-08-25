# frozen_string_literal: true

module Api
  module V1
    class ContentReportsController < BaseController
      before_action :authenticate_user!

      def index
        authorize ContentReport
        reports = policy_scope(ContentReport)

        if params[:group_id].present?
          reports = reports.where(group_id: params[:group_id])
        end

        # Filter by status: open, resolved, dismissed
        if params[:status].present?
          reports = reports.where(status: params[:status])
        else
          reports = reports.open_reports
        end

        reports = reports.includes(:reporter, :resolved_by, :reportable).order(created_at: :desc)

        render json: { data: serialize_reports(reports) }
      end

      def create
        reportable = find_reportable
        unless reportable
          return render json: { error: { code: 'NOT_FOUND', message: 'Conteúdo não encontrado' } }, status: :not_found
        end

        # Resolve group_id securely based on the reportable resource
        group_id = nil
        if reportable.is_a?(GroupPost)
          group_id = reportable.group_id
        elsif reportable.is_a?(Comment) && reportable.commentable.is_a?(GroupPost)
          group_id = reportable.commentable.group_id
        end

        report = ContentReport.new(
          reportable: reportable,
          reporter: current_user,
          group_id: group_id,
          reason: params[:reason],
          details: params[:details],
          status: 'open'
        )

        authorize report

        if report.save
          # Trigger moderation event
          track_moderation_event('group_post_reported', report) if reportable.is_a?(GroupPost)
          track_moderation_event('group_comment_reported', report) if reportable.is_a?(Comment)

          render json: { status: 'success', data: serialize_report(report) }, status: :created
        else
          render json: { error: { code: 'VALIDATION_ERROR', message: report.errors.full_messages.join(', ') } }, status: :unprocessable_entity
        end
      end

      def update
        report = ContentReport.find(params[:id])
        authorize report

        status = params[:status]
        unless status.in?(%w[resolved dismissed])
          return render json: { error: { code: 'BAD_REQUEST', message: 'Status inválido' } }, status: :bad_request
        end

        report.assign_attributes(
          status: status,
          resolved_by: current_user,
          resolved_at: Time.current
        )

        if report.save
          if status == 'resolved'
            # Hide/remove the reported content
            reportable = report.reportable
            if reportable.is_a?(GroupPost)
              reportable.update!(status: 'removed')
              track_moderation_event('group_post_hidden', report)
            elsif reportable.is_a?(Comment)
              reportable.update!(status: 'hidden')
              track_moderation_event('group_comment_hidden', report)
            end
          end

          render json: { status: 'success', data: serialize_report(report) }, status: :ok
        else
          render json: { error: { code: 'VALIDATION_ERROR', message: report.errors.full_messages.join(', ') } }, status: :unprocessable_entity
        end
      end

      private

      def find_reportable
        type = params[:reportable_type]
        id = params[:reportable_id]

        case type
        when 'GroupPost' then GroupPost.find_by(id: id)
        when 'Comment' then Comment.find_by(id: id)
        else nil
        end
      end

      def track_moderation_event(event_name, report)
        # Use existing Analytics if it accepts track
        # Since it is a background moderation event, we log it or call track
        # Safe wrapper to avoid crashing if track throws
        begin
          if defined?(Analytics) && Analytics.respond_to?(:track)
            Analytics.track(
              user: current_user,
              event: event_name,
              properties: {
                report_id: report.id,
                reportable_type: report.reportable_type,
                reportable_id: report.reportable_id,
                group_id: report.group_id
              }
            )
          end
        rescue => e
          Rails.logger.error("Failed to track moderation event #{event_name}: #{e.message}")
        end
      end

      def serialize_reports(reports)
        reports.map { |r| serialize_report(r) }
      end

      def serialize_report(report)
        {
          id: report.id,
          reportable_type: report.reportable_type,
          reportable_id: report.reportable_id,
          reason: report.reason,
          details: report.details,
          status: report.status,
          created_at: report.created_at.iso8601,
          reporter: {
            id: report.reporter_id,
            name: report.reporter&.name
          },
          resolved_by: report.resolved_by_id ? {
            id: report.resolved_by_id,
            name: report.resolved_by&.name
          } : nil,
          resolved_at: report.resolved_at&.iso8601
        }
      end
    end
  end
end
