# frozen_string_literal: true

module Sales
  module Campaigns
    class Preflight
      def self.call(campaign:)
        new(campaign: campaign).call
      end

      def initialize(campaign:)
        @campaign = campaign
        @blockers = []
        @warnings = []
      end

      def call
        check_name
        check_template
        check_sender
        check_sending_gate
        check_tracking_host
        check_provider
        check_audience
        check_status

        ready = @blockers.empty?

        {
          ready: ready,
          blockers: @blockers,
          warnings: @warnings,
          audience: audience_summary,
          sender: sender_summary,
          provider: provider_summary,
          qa_audit: qa_audit_summary
        }
      end

      private

      def check_name
        if @campaign.name.blank?
          @blockers << { code: 'MISSING_NAME', message: 'A campanha precisa de um nome válido.' }
        end
      end

      def check_template
        template = @campaign.email_template
        if template.nil?
          @blockers << { code: 'MISSING_TEMPLATE', message: 'Selecione um template de e-mail.' }
        elsif template.body_html.blank? && template.body_json.blank?
          @blockers << { code: 'EMPTY_TEMPLATE_BODY', message: 'O template selecionado não possui conteúdo.' }
        elsif template.subject_template.blank?
          @warnings << { code: 'EMPTY_SUBJECT_TEMPLATE', message: 'O template de e-mail não especifica assunto personalizado.' }
        end

        return if template.nil?

        Array(qa_audit_summary[:findings]).each do |finding|
          next unless %w[UNKNOWN_PLACEHOLDER INVALID_OR_INSECURE_LINK].include?(finding[:code])

          @warnings << { code: finding[:code], message: finding[:message] }
        end
      end

      def check_sender
        sender_id = @campaign.user_id
        if sender_id.nil?
          @blockers << { code: 'MISSING_SENDER', message: 'Nenhum usuário remetente foi associado à campanha.' }
        end

        if @campaign.company.try(:email).blank?
          @warnings << { code: 'MISSING_COMPANY_EMAIL', message: 'Endereço da empresa ausente; usando remetente padrão.' }
        end
      end

      def check_provider
        return if provider_summary[:status] == 'operational'

        @blockers << {
          code: 'PROVIDER_NOT_OPERATIONAL',
          message: provider_summary[:message]
        }
      end

      def check_sending_gate
        return if ::Sales::Messaging::SendingGate.enabled?

        @blockers << { code: 'EMAIL_SENDING_DISABLED', message: 'O envio de e-mail está desabilitado pela configuração operacional.' }
      end

      def check_tracking_host
        return if ::Sales::Messaging::TrackingHost.configured?

        @blockers << { code: 'EMAIL_TRACKING_HOST_MISSING', message: 'O host HTTPS de tracking de email não está configurado.' }
      end

      def check_audience
        count = audience_summary[:estimated_count]
        if count.zero?
          @blockers << { code: 'EMPTY_AUDIENCE', message: 'O filtro de público não retornou contatos elegíveis.' }
        elsif count < 5
          @warnings << { code: 'SMALL_AUDIENCE', message: "O público estimado é pequeno (#{count} contatos)." }
        end
      end

      def check_status
        unless %w[draft scheduled paused failed].include?(@campaign.status)
          @blockers << { code: 'INVALID_STATUS', message: "Campanha em estado '#{@campaign.status}' não pode ser submetida a preflight." }
        end
      end

      def audience_summary
        @audience_summary ||= {
          estimated_count: ::Sales::Campaigns::AudienceResolver.call(
            company_id: @campaign.company_id, filter: @campaign.audience_filter
          ).fetch(:total_count)
        }
      end

      def sender_summary
        user = @campaign.user
        {
          sender_id: user&.id,
          sender_name: user&.name || 'Sistema',
          from_email: @campaign.company.try(:email).presence || 'contato@avaliasolar.com.br'
        }
      end

      def provider_summary
        @provider_summary ||= ::Sales::Messaging::Providers::HealthCheck.call(from_email: sender_summary[:from_email])
      end

      def qa_audit_summary
        @qa_audit_summary ||= begin
          template = @campaign.email_template
          if template.nil? || !defined?(::Sales::Ai::ClaimChecker)
            { checked: false, findings_count: 0, findings: [] }
          else
            blocks_text = if template.body_json.is_a?(Hash) && template.body_json['blocks'].is_a?(Array)
                            template.body_json['blocks'].map { |b| b.is_a?(Hash) ? b.values.join(' ') : b.to_s }.join("\n")
                          else
                            ''
                          end
            combined = [template.subject_template, template.preheader, template.body_html, blocks_text].compact.join("\n")
            findings = ::Sales::Ai::ClaimChecker.check(text: combined)
            {
              checked: true,
              findings_count: findings.size,
              findings: findings
            }
          end
        end
      end
    end
  end
end
