# frozen_string_literal: true

require 'digest'
require 'securerandom'

module Api
  module V1
    class IntentSignalsController < BaseController
      # POST /api/v1/intent_signals
      def create
        safe_params = intent_params
        # A retry must not create another scoreable activity.
        if safe_params[:event_id].present?
          existing = BuyerIntentActivity.find_by(
            company_id: safe_params[:company_id], event_id: safe_params[:event_id]
          )
          return render json: { status: 'ok', id: existing.id, duplicate: true }, status: :ok if existing
        end

        activity = BuyerIntentActivity.new(safe_params)
        # Never trust browser-provided identity, weight or clock.
        activity.user = current_user if current_user
        activity.intent_weight = BuyerIntentActivity::INTENT_WEIGHTS.fetch(activity.signal_type, 1)
        activity.ip_hash = Digest::SHA256.hexdigest(remote_ip)
        activity.user_agent = request.user_agent.to_s
        activity.device_type = detect_device_type(activity.user_agent)
        activity.tracked_at = Time.current

        if activity.save
          mirror_to_analytics!(activity)
          enqueue_scoring_job(activity)
          render json: { status: 'ok', id: activity.id, event_id: activity.event_id }, status: :created
        else
          render json: { errors: activity.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotUnique
        # Concurrent retries may race past the initial lookup.
        existing = BuyerIntentActivity.find_by(
          company_id: params[:company_id], event_id: params[:event_id]
        )
        return render json: { status: 'ok', id: existing.id, duplicate: true }, status: :ok if existing

        raise
      end

      private

      def intent_params
        params.permit(
          :company_id,
          :event_id,
          :anonymous_id,
          :session_id,
          :signal_type,
          :signal_category,
          :element_selector,
          :element_type,
          :page_path,
          :referrer_host,
          :duration_ms,
          metadata: {}
        )
      end

      def enqueue_scoring_job(activity)
        # All accepted signals contribute to the score. A hot-only dispatch
        # leaves low-intent sessions permanently absent from Buyer Intent.
        return if activity.user_id.blank? && activity.anonymous_id.blank?

        CalculateBuyerIntentJob.perform_later(
          activity.company_id,
          lead_id: activity.user_id,
          anonymous_id: activity.user_id.present? ? nil : activity.anonymous_id
        )

        # Do not call StitchIdentityJob with an unverified anonymous_id:
        # the browser can choose it. Identity linkage requires session proof.
      end

      def mirror_to_analytics!(activity)
        return unless defined?(AnalyticsEvent)

        AnalyticsEvent.create!(
          company_id: activity.company_id,
          user_id: activity.user_id,
          event_type: 'micro_interaction',
          event_id: "intent_#{activity.id}",
          tracked_at: activity.tracked_at,
          metadata: {
            action: activity.signal_type,
            signal_category: activity.signal_category,
            intent_weight: activity.intent_weight,
            element_selector: activity.element_selector,
            element_type: activity.element_type,
            page_path: activity.page_path,
            referrer_host: activity.referrer_host,
            duration_ms: activity.duration_ms,
            anonymous_id: activity.anonymous_id,
            session_id: activity.session_id,
            source: 'intent_signals',
            metadata: activity.metadata
          },
          action: activity.signal_type,
          duration_ms: activity.duration_ms,
          element_id: activity.element_selector,
          element_type: activity.element_type,
          anonymous_id: activity.anonymous_id,
          context: {
            action: activity.signal_type,
            signal_category: activity.signal_category,
            metadata: activity.metadata
          }
        )
      rescue ActiveRecord::RecordNotUnique
        nil
      rescue StandardError => e
        # The canonical intent activity has already been committed; a
        # secondary analytics outage must not turn it into a false HTTP 500.
        Rails.logger.warn("[IntentSignals] analytics mirror failed: #{e.class}")
      end

      def detect_device_type(user_agent)
        return 'mobile' if user_agent.match?(/Mobile|Android|iPhone/i)
        return 'tablet' if user_agent.match?(/iPad|Tablet/i)

        'desktop'
      end

      def remote_ip
        request.remote_ip.to_s.presence || request.ip.to_s
      end
    end
  end
end
