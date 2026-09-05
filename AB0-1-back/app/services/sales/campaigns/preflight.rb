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
        elsif template.body_html.blank?
          @blockers << { code: 'EMPTY_TEMPLATE_BODY', message: 'O template selecionado não possui conteúdo HTML.' }
        elsif template.subject_template.blank?
          @warnings << { code: 'EMPTY_SUBJECT_TEMPLATE', message: 'O template de e-mail não especifica assunto personalizado.' }
        end
      end

      def check_sender
        sender_id = @campaign.user_id || @campaign.company&.users&.first&.id
        if sender_id.nil?
          @blockers << { code: 'MISSING_SENDER', message: 'Nenhum usuário remetente foi associado à campanha.' }
        end

        if @campaign.company.try(:email).blank?
          @warnings << { code: 'MISSING_COMPANY_EMAIL', message: 'Endereço da empresa ausente; usando remetente padrão.' }
        end
      end

      def check_audience
        contacts = ::Sales::Campaigns::AudienceResolver.call(
          company_id: @campaign.company_id,
          filter: @campaign.audience_filter
        )

        if contacts.empty?
          @blockers << { code: 'EMPTY_AUDIENCE', message: 'O filtro de público não retornou nenhum contato legível (com e-mail e opt-in).' }
        elsif contacts.size < 5
          @warnings << { code: 'SMALL_AUDIENCE', message: "O público estimado é pequeno (#{contacts.size} contatos)." }
        end
      end

      def check_status
        unless %w[draft scheduled paused failed].include?(@campaign.status)
          @blockers << { code: 'INVALID_STATUS', message: "Campanha em estado '#{@campaign.status}' não pode ser submetida a preflight." }
        end
      end

      def audience_summary
        contacts = ::Sales::Campaigns::AudienceResolver.call(
          company_id: @campaign.company_id,
          filter: @campaign.audience_filter
        )
        { estimated_count: contacts.size }
      end

      def sender_summary
        user = @campaign.user || @campaign.company&.users&.first
        {
          sender_id: user&.id,
          sender_name: user&.name || 'Sistema',
          from_email: @campaign.company.try(:email).presence || 'contato@avaliasolar.com.br'
        }
      end

      def provider_summary
        {
          provider: 'aws_ses',
          status: 'configured'
        }
      end
    end
  end
end
