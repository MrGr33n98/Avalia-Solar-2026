# frozen_string_literal: true

module Api
  module V1
    class NotificationPreferencesController < BaseController
      before_action :authenticate_api_user

      # GET /api/v1/notification_preferences
      def show
        prefs = NotificationPreference.default_for_user(current_user)
        render json: {
          preferences: prefs.map { |p| preference_json(p) }
        }
      end

      # PUT /api/v1/notification_preferences
      def update
        preferences_params = params.require(:preferences)

        preferences_params.each do |pref_data|
          pref = current_user.notification_preferences.find_or_initialize_by(event_type: pref_data[:event_type])
          pref.update!(
            in_app_enabled: pref_data[:in_app_enabled] ?? pref.in_app_enabled,
            email_enabled: pref_data[:email_enabled] ?? pref.email_enabled,
            push_enabled: pref_data[:push_enabled] ?? pref.push_enabled,
            whatsapp_enabled: pref_data[:whatsapp_enabled] ?? pref.whatsapp_enabled,
            frequency: pref_data[:frequency] || pref.frequency,
            consent_version: pref_data[:consent_version] || pref.consent_version,
            consented_at: pref_data[:whatsapp_enabled] ? Time.current : pref.consented_at
          )
        end

        render json: {
          success: true,
          preferences: current_user.notification_preferences.map { |p| preference_json(p) }
        }
      end

      private

      def preference_json(p)
        {
          id: p.id,
          event_type: p.event_type,
          in_app_enabled: p.in_app_enabled,
          email_enabled: p.email_enabled,
          push_enabled: p.push_enabled,
          whatsapp_enabled: p.whatsapp_enabled,
          frequency: p.frequency,
          consent_version: p.consent_version,
          consented_at: p.consented_at&.iso8601
        }
      end
    end
  end
end
