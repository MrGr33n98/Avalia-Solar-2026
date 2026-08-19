module Api
  module V1
    class LeadDistributionsController < BaseController
      before_action :authenticate_api_user
      before_action :set_distribution
      before_action :authorize_distribution_company

      def show
        @distribution.mark_viewed! if @distribution.sent?
        render json: distribution_payload
      end

      def viewed
        @distribution.mark_viewed!
        render json: distribution_payload
      end

      def accept
        @distribution.accept!
        track_event('lead_distribution_accepted')
        render json: distribution_payload
      rescue ActiveRecord::RecordInvalid, ArgumentError => e
        render json: { error: 'invalid_transition', message: e.message }, status: :unprocessable_entity
      end

      def reject
        @distribution.reject!(params.require(:reason), notes: params[:notes])
        track_event('lead_distribution_rejected')
        render json: distribution_payload
      rescue ActiveRecord::RecordInvalid, ArgumentError, ActionController::ParameterMissing => e
        render json: { error: 'invalid_rejection', message: e.message }, status: :unprocessable_entity
      end

      def convert
        @distribution.convert!
        track_event('lead_converted')
        render json: distribution_payload
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: 'invalid_transition', message: e.message }, status: :unprocessable_entity
      end

      private

      def set_distribution
        @distribution = LeadDistribution.find(params[:id])
      end

      def authorize_distribution_company
        return if current_user&.admin?
        return if current_user&.company_id.to_i == @distribution.company_id
        return if current_user&.active_membership_for?(@distribution.company_id)

        render json: { error: 'forbidden' }, status: :forbidden
      end

      def distribution_payload
        {
          distribution: {
            id: @distribution.id,
            lead_id: @distribution.lead_id,
            company_id: @distribution.company_id,
            status: @distribution.status,
            match_score: @distribution.match_score,
            sent_at: @distribution.sent_at,
            viewed_at: @distribution.viewed_at,
            accepted_at: @distribution.accepted_at,
            rejected_at: @distribution.rejected_at,
            expired_at: @distribution.expired_at,
            converted_at: @distribution.converted_at,
            rejection_reason: @distribution.rejection_reason
          }
        }
      end

      def track_event(event_name)
        Analytics::TrackEventService.call(
          company_id: @distribution.company_id,
          event_type: event_name,
          metadata: { lead_id: @distribution.lead_id, distribution_id: @distribution.id }
        )
      rescue StandardError => e
        Rails.logger.warn("[LeadDistribution] analytics failed: #{e.class}: #{e.message}")
      end
    end
  end
end
