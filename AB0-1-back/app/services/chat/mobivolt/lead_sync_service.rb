# frozen_string_literal: true

module Chat
  module Mobivolt
    class LeadSyncService
      def self.sync!(chat_lead)
        new(chat_lead).sync!
      end

      def initialize(chat_lead)
        @chat_lead = chat_lead
        @session = chat_lead.chat_session
        @metadata = chat_lead.metadata || {}
      end

      def sync!
        return nil if @chat_lead.nil?

        # 1. Validação de Consentimento LGPD
        unless @chat_lead.consent_given?
          Rails.logger.warn("[Chat::Mobivolt::LeadSyncService] Skipping sync for ChatLead ##{@chat_lead.id} due to missing LGPD consent.")
          return nil
        end

        # 2. Mecanismo Idempotente (Evitar Duplicidade)
        existing_lead = find_duplicate_lead
        
        # 3. Calcular Score Enriquecido Comercial da IA
        score = Chat::Mobivolt::LeadScoreCalculator.calculate(@chat_lead)
        q_level = Chat::Mobivolt::LeadScoreCalculator.qualification_level(score)

        # 4. Compilar Mensagens Inicial e Final da Sessão
        user_msgs = @session&.chat_messages&.user_messages&.chronological || []
        initial_question = user_msgs.first&.content
        last_user_message = user_msgs.last&.content

        # 5. Mapeamento e Atribuição de Campos do Lead Principal
        lead_attributes = {
          name: @chat_lead.name,
          email: @chat_lead.email,
          phone: @chat_lead.phone,
          city: @chat_lead.city,
          state: @chat_lead.state,
          location: [@chat_lead.city, @chat_lead.state].compact.join(', '),
          address_full: [@chat_lead.city, @chat_lead.state].compact.join(', '),
          source: 'mobivolt_ai',
          product_vertical: @chat_lead.vertical,
          project_type: @chat_lead.project_type,
          decision_timeline: @chat_lead.decision_timeline,
          bill_value: @chat_lead.monthly_bill,
          message: @chat_lead.summary,
          
          # Atributos de Chat RAG
          chat_lead_id: @chat_lead.id,
          chat_session_id: @chat_lead.chat_session_id,
          recommended_company_ids: Array(@metadata['recommended_company_ids']),
          clicked_company_id: @metadata['clicked_company_id'],
          quote_requested_company_id: @metadata['quote_requested_company_id'],
          whatsapp_clicked_company_id: @metadata['whatsapp_clicked_company_id'],
          comparison_company_ids: Array(@metadata['comparison_company_ids']),
          
          # Inteligência Comercial e Enriquecimento
          intent_type: @chat_lead.intent,
          vertical: @chat_lead.vertical,
          lead_score: score,
          qualification_level: q_level,
          ai_summary: build_ai_summary(score, q_level),
          next_best_action: @chat_lead.recommended_next_action,
          initial_question: initial_question,
          last_user_message: last_user_message,
          source_page_url: @chat_lead.source_page,
          
          # LGPD
          lgpd_consent_version: @metadata['lgpd_consent_version'] || 'v1',
          lgpd_consent_at: @chat_lead.consent_given_at,
          lgpd_consent_text: @metadata['lgpd_consent_text'] || 'Aceito compartilhar meus dados conforme a LGPD para me conectar com as melhores ofertas.',
          consent_at: @chat_lead.consent_given_at
        }

        # Tratamento de FK opcional de Company (se houver quote_requested_company_id, vinculamos como principal)
        primary_company_id = @metadata['quote_requested_company_id'] || @metadata['clicked_company_id']
        lead_attributes[:company_id] = primary_company_id if primary_company_id.present?

        # Cria ou Atualiza de forma idempotente
        lead = if existing_lead
                 existing_lead.update!(lead_attributes)
                 existing_lead
               else
                 Lead.create!(lead_attributes)
               end

        # Disparar telemetria de sucesso no PostHog
        Chat::PosthogTrackingService.track(
          event: 'mobivolt_lead_synced_to_leads',
          distinct_id: @session&.visitor_id || 'anonymous',
          properties: {
            lead_id: lead.id,
            chat_lead_id: @chat_lead.id,
            score: score,
            qualification_level: q_level
          }
        )

        lead
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::LeadSyncService] Sync failed for ChatLead ##{@chat_lead&.id}: #{e.class} - #{e.message}")
        Chat::PosthogTrackingService.track(
          event: 'mobivolt_lead_sync_failed',
          distinct_id: @session&.visitor_id || 'anonymous',
          properties: {
            chat_lead_id: @chat_lead&.id,
            error: e.message
          }
        )
        # Relança para o ActiveJob poder fazer o retry resiliente
        raise e
      end

      private

      def find_duplicate_lead
        return nil if @chat_lead.chat_session_id.blank?

        # Procura por duplicados da mesma sessão criados nos últimos 5 minutos com mesmo e-mail ou telefone
        query = Lead.where(chat_session_id: @chat_lead.chat_session_id)
                    .where('created_at > ?', 5.minutes.ago)

        if @chat_lead.phone.present? && @chat_lead.email.present?
          query.where('phone = ? OR email = ?', @chat_lead.phone, @chat_lead.email).first
        elsif @chat_lead.phone.present?
          query.where(phone: @chat_lead.phone).first
        elsif @chat_lead.email.present?
          query.where(email: @chat_lead.email).first
        else
          query.first
        end
      end

      def build_ai_summary(score, q_level)
        companies_meta = Array(@metadata['recommended_company_ids'])
        companies_names = if companies_meta.any?
                            Company.where(id: companies_meta).pluck(:name).join(', ')
                          else
                            'Nenhuma'
                          end
        
        quote_co = @metadata['quote_requested_company_id'].present? ? Company.find_by(id: @metadata['quote_requested_company_id'])&.name : nil
        clicked_co = @metadata['clicked_company_id'].present? ? Company.find_by(id: @metadata['clicked_company_id'])&.name : nil

        summary_parts = []
        summary_parts << "Lead capturado via MobiVolt AI no chatbot do Avalia Solar."
        summary_parts << "Vertical: #{@chat_lead.vertical&.humanize || 'Solar'} | Intenção: #{@chat_lead.intent&.humanize || 'Indefinida'}."
        summary_parts << "Empresas Recomendadas no Chat: #{companies_names}."
        summary_parts << "Usuário clicou no perfil da empresa: #{clicked_co}." if clicked_co
        summary_parts << "Usuário solicitou orçamento direto para: #{quote_co}." if quote_co
        summary_parts << "Score de Vendas: #{score}/100 (#{q_level.upcase})."
        summary_parts << "Análise de LGPD: Consentimento obtido em #{@chat_lead.consent_given_at&.strftime('%d/%m/%Y %H:%M') || 'N/A'} (IP/versão: #{@metadata['lgpd_consent_version'] || 'v1'})."
        
        if @chat_lead.summary.present?
          summary_parts << "\n--- Resumo Adicional do Chat ---\n#{@chat_lead.summary}"
        end

        summary_parts.join("\n")
      end
    end
  end
end
