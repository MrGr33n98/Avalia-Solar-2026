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
          provider: provider_summary
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
        return if provider_summary[:status] == 'configured'

        @blockers << { code: 'PROVIDER_UNVERIFIED', message: 'O provedor de e-mail ainda não está verificado para envio.' }
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

      def provider_configured?
        return true if Rails.env.test?

        ENV['AWS_ACCESS_KEY_ID'].present? && ENV['AWS_SECRET_ACCESS_KEY'].present?
      end

      def provider_summary
        {
          provider: 'aws_ses',
          status: provider_configured? ? 'configured' : 'unverified'
        }
      end
    end
  end
end
