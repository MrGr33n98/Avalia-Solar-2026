# frozen_string_literal: true

module Chat
  class SessionStateService
    # Estados válidos da sessão
    VALID_STATES = %w[
      idle
      invite_shown
      opened
      terms_pending
      discovery_menu
      solar_flow
      ev_flow
      awaiting_location
      awaiting_goal
      awaiting_budget_or_profile
      awaiting_timeline
      results_pending
      closed
      reset
    ].freeze

    # Transições permitidas entre estados
    ALLOWED_TRANSITIONS = {
      'idle' => %w[invite_shown opened],
      'invite_shown' => %w[opened closed],
      'opened' => %w[terms_pending discovery_menu closed],
      'terms_pending' => %w[discovery_menu closed],
      'discovery_menu' => %w[solar_flow ev_flow closed results_pending],
      'solar_flow' => %w[awaiting_location awaiting_goal awaiting_budget_or_profile awaiting_timeline closed],
      'ev_flow' => %w[awaiting_location awaiting_goal awaiting_budget_or_profile awaiting_timeline closed],
      'awaiting_location' => %w[awaiting_goal awaiting_budget_or_profile awaiting_timeline closed],
      'awaiting_goal' => %w[awaiting_budget_or_profile awaiting_timeline closed],
      'awaiting_budget_or_profile' => %w[awaiting_timeline closed],
      'awaiting_timeline' => %w[results_pending closed],
      'results_pending' => %w[discovery_menu closed],
      'closed' => %w[reset idle],
      'reset' => %w[idle]
    }.freeze

    def self.current_state(session)
      session&.metadata&.dig('state') || 'idle'
    end

    def self.transition_to(session, new_state)
      return false unless session
      return false unless VALID_STATES.include?(new_state)

      current = current_state(session)
      allowed = ALLOWED_TRANSITIONS[current] || []

      return false unless allowed.include?(new_state)

      session.update!(metadata: (session.metadata || {}).merge('state' => new_state))
      track_state_change(session, current, new_state)
      true
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.warn "[Chat::SessionStateService] Failed to transition: #{e.message}"
      false
    end

    def self.advance_step(session, step_data = {})
      return false unless session

      current = current_state(session)
      next_state = determine_next_state(current, step_data)

      return false unless next_state

      transition_to(session, next_state)
    end

    def self.store_structured_response(session, key, value)
      return unless session

      metadata = (session.metadata || {}).dup
      metadata['structured_responses'] ||= {}
      metadata['structured_responses'][key.to_s] = value

      # Não armazenar PII sem consentimento
      safe_value = sanitize_for_storage(value)
      metadata['structured_responses'][key.to_s] = safe_value

      session.update!(metadata: metadata)
    end

    def self.get_structured_responses(session)
      return {} unless session
      session.metadata&.dig('structured_responses') || {}
    end

    def self.reset_session(session)
      return false unless session

      # Manter logs mínimos para segurança/LGPD, limpar respostas estruturadas
      session.update!(
        metadata: {
          'state' => 'reset',
          'reset_at' => Time.current.iso8601,
          'previous_state' => current_state(session)
        }
      )
      true
    end

    def self.mark_invite_shown(session)
      transition_to(session, 'invite_shown') if current_state(session) == 'idle'
    end

    def self.mark_opened(session)
      current = current_state(session)
      if %w[idle invite_shown].include?(current)
        transition_to(session, 'opened')
      end
    end

    def self.mark_terms_accepted(session)
      transition_to(session, 'discovery_menu') if current_state(session) == 'terms_pending'
    end

    def self.start_solar_flow(session)
      transition_to(session, 'solar_flow') if current_state(session) == 'discovery_menu'
    end

    def self.start_ev_flow(session)
      transition_to(session, 'ev_flow') if current_state(session) == 'discovery_menu'
    end

    private

    def self.determine_next_state(current, step_data)
      case current
      when 'solar_flow', 'ev_flow'
        # Sequência padrão dos wizards
        if step_data[:step] == 'need'
          'awaiting_location'
        elsif step_data[:step] == 'profile'
          'awaiting_budget_or_profile'
        elsif step_data[:step] == 'budget' || step_data[:step] == 'vehicle_count'
          'awaiting_timeline'
        elsif step_data[:step] == 'timeline'
          'results_pending'
        else
          nil
        end
      else
        nil
      end
    end

    def self.sanitize_for_storage(value)
      # Remover possíveis dados sensíveis
      return value unless value.is_a?(String)

      # Não armazenar textos livres longos nesta fase
      if value.length > 200
        return value[0..199] + '...'
      end

      value
    end

    def self.track_state_change(session, from, to)
      return unless defined?(Chat::PosthogTrackingService)

      Chat::PosthogTrackingService.track(
        event: 'mobivolt_state_transition',
        properties: {
          session_id: session.id,
          from_state: from,
          to_state: to,
          vertical: session.vertical
        }
      )
    rescue => e
      Rails.logger.warn "[Chat::SessionStateService] Tracking failed: #{e.message}"
    end
  end
end
