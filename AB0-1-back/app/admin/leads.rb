# frozen_string_literal: true

ActiveAdmin.register Lead do
  menu false

  permit_params :name, :email, :phone, :company, :message, :project_type, :estimated_budget,
                :location, :company_id, :product_vertical, :project_profile, :quote_type,
                :system_size_band, :bill_value, :monthly_kwh, :decision_timeline, :address_full,
                :city, :state, :zipcode, :consent_at, :consent_ip, :otp_sent_at, :otp_verified_at,
                :otp_attempts, :wizard_status, :chat_lead_id, :chat_session_id, :source,
                :recommended_company_ids, :clicked_company_id, :quote_requested_company_id,
                :whatsapp_clicked_company_id, :comparison_company_ids, :intent_type, :vertical,
                :qualification_level, :lead_score, :ai_summary, :next_best_action, :initial_question,
                :last_user_message, :source_page_url, :lgpd_consent_version, :lgpd_consent_at,
                :lgpd_consent_text

  # Scopes no topo da Listagem
  scope 'Todos', :all, default: true
  scope 'MobiVolt AI', ->(leads) { leads.where(source: 'mobivolt_ai') }
  scope 'Leads Quentes', ->(leads) { leads.where('lead_score >= 70') }
  scope 'Orçamento Solicitado', ->(leads) { leads.where.not(quote_requested_company_id: nil) }
  scope 'Com Patrocinada', lambda { |leads|
    begin
      leads.where(source: 'mobivolt_ai').where('recommended_company_ids::text LIKE ?', '%"sponsored":true%')
    rescue StandardError
      leads.none
    end
  }

  # Filtros na barra lateral
  filter :name
  filter :email
  filter :phone
  filter :source, as: :select, collection: -> { Lead.pluck(:source).uniq.compact }
  filter :lead_score
  filter :qualification_level, as: :select, collection: %w[quente morno frio]
  filter :vertical, as: :select, collection: %w[solar electric_mobility]
  filter :intent_type, as: :select,
                       collection: %w[solar_quote ev_charger_installation condominium_charging fleet_electrification company_recommendation]
  filter :city
  filter :state
  filter :wizard_status, as: :select
  filter :created_at

  # Index (Listagem Geral)
  index do
    selectable_column
    id_column
    column :name
    column :contato do |lead|
      div do
        div { lead.phone }
        div { lead.email }
      end
    end
    column :localizacao do |lead|
      [lead.city, lead.state].compact.join('/')
    end
    column :origem do |lead|
      if lead.source == 'mobivolt_ai'
        status_tag 'MobiVolt AI', class: 'ok', style: 'background: #0284c7; color: white;'
      else
        status_tag lead.source.to_s.humanize, class: 'light'
      end
    end
    column :score do |lead|
      if lead.lead_score.present?
        status_tag "#{lead.lead_score} pts",
                   class: if lead.lead_score >= 70
                            'ok'
                          else
                            (lead.lead_score >= 40 ? 'warning' : 'error')
                          end
      else
        span class: 'empty-value' do
          'N/A'
        end
      end
    end
    column :temperatura do |lead|
      if lead.qualification_level.present?
        emoji = case lead.qualification_level
                when 'quente' then '🔥'
                when 'morno' then '🌡️'
                else '❄️'
                end
        status_tag "#{emoji} #{lead.qualification_level.upcase}", class: case lead.qualification_level
                                                                         when 'quente' then 'ok'
                                                                         when 'morno' then 'warning'
                                                                         else 'error'
                                                                         end
      else
        span class: 'empty-value' do
          'N/A'
        end
      end
    end
    column :wizard_status
    column :created_at
    actions
  end

  # Show (Visualização do Detalhe)
  show do
    columns do
      column span: 2 do
        attributes_table title: 'Dados do Lead' do
          row :id
          row :name
          row :email
          row :phone
          row :company
          row :message
          row :project_type
          row :estimated_budget
          row :address_full
          row :city
          row :state
          row :zipcode
          row :wizard_status
          row :created_at
          row :updated_at
        end

        # Exibe painel do assistente virtual se o Lead for de origem MobiVolt AI
        if resource.source == 'mobivolt_ai'
          panel 'Conversa do Chat (Metadados de IA)' do
            attributes_table_for resource do
              row :initial_question do |l|
                div style: 'font-style: italic; color: #555;' do
                  l.initial_question
                end
              end
              row :last_user_message do |l|
                div style: 'font-style: italic; color: #555;' do
                  l.last_user_message
                end
              end
              row :source_page_url do |l|
                link_to l.source_page_url, l.source_page_url, target: '_blank' if l.source_page_url.present?
              end
              row :chat_session do |l|
                if l.chat_session_id.present?
                  link_to "Sessão ##{l.chat_session_id}",
                          admin_chat_session_path(l.chat_session)
                end
              end
              row :chat_lead do |l|
                link_to "Lead do Chat ##{l.chat_lead_id}", admin_chat_lead_path(l.chat_lead) if l.chat_lead_id.present?
              end
            end
          end
        end
      end

      column span: 1 do
        # Painel lateral exclusivo com inteligência de vendas do MobiVolt AI
        if resource.source == 'mobivolt_ai'
          panel '🤖 Inteligência de Vendas MobiVolt AI', style: 'border: 2px solid #0284c7; border-radius: 8px;' do
            attributes_table_for resource do
              row :lead_score do |l|
                status_tag "#{l.lead_score} Pontos",
                           class: if l.lead_score >= 70
                                    'ok'
                                  else
                                    (l.lead_score >= 40 ? 'warning' : 'error')
                                  end
              end
              row :qualification_level do |l|
                emoji = case l.qualification_level
                        when 'quente' then '🔥🔥 Quente'
                        when 'morno' then '🌡️ Morno'
                        else '❄️ Frio'
                        end
                status_tag emoji, class: case l.qualification_level
                                         when 'quente' then 'ok'
                                         when 'morno' then 'warning'
                                         else 'error'
                                         end
              end
              row :intent_type do |l|
                status_tag l.intent_type.to_s.humanize, class: 'light'
              end
              row :vertical do |l|
                status_tag l.vertical.to_s.humanize, class: 'light'
              end
              row :proxima_melhor_acao do |l|
                div style: 'font-weight: bold; color: #0369a1;' do
                  l.next_best_action || 'Nenhuma ação sugerida'
                end
              end
              row :resumo_comercial_da_ia do |l|
                div style: 'white-space: pre-wrap; font-size: 12px; line-height: 1.5;' do
                  l.ai_summary
                end
              end
            end
          end

          panel '🏢 Empresas Envolvidas no RAG' do
            attributes_table_for resource do
              row :empresas_recomendadas do |l|
                if l.recommended_company_ids.present?
                  begin
                    ids = Array(l.recommended_company_ids)
                    companies = Company.where(id: ids)
                    companies.map { |c| link_to c.name, admin_company_path(c) }.join(', ').html_safe
                  rescue StandardError
                    l.recommended_company_ids.to_s
                  end
                else
                  'Nenhuma recomendação registrada'
                end
              end
              row :perfil_clicado do |l|
                if l.clicked_company_id.present?
                  c = Company.find_by(id: l.clicked_company_id)
                  link_to c.name, admin_company_path(c) if c
                else
                  'Nenhum clique de perfil registrado'
                end
              end
              row :orcamento_solicitado_para do |l|
                if l.quote_requested_company_id.present?
                  c = Company.find_by(id: l.quote_requested_company_id)
                  link_to c.name, admin_company_path(c) if c
                else
                  'Orçamento personalizado não solicitado'
                end
              end
              row :clique_em_whatsapp do |l|
                if l.whatsapp_clicked_company_id.present?
                  c = Company.find_by(id: l.whatsapp_clicked_company_id)
                  link_to c.name, admin_company_path(c) if c
                else
                  'Nenhum clique no WhatsApp'
                end
              end
            end
          end

          panel '⚖️ Conformidade e LGPD' do
            attributes_table_for resource do
              row :consentimento do |_l|
                status_tag 'Aceito e Auditado', class: 'ok'
              end
              row :data_do_consentimento do |l|
                l.lgpd_consent_at&.strftime('%d/%m/%Y %H:%M:%S UTC')
              end
              row :versao_do_termo do |l|
                l.lgpd_consent_version || 'v1'
              end
              row :texto_do_consentimento do |l|
                div style: 'font-size: 10px; color: #666; line-height: 1.4;' do
                  l.lgpd_consent_text
                end
              end
            end
          end
        end
      end
    end
  end

  # Form de Edição
  form do |f|
    f.inputs 'Identificação' do
      f.input :name
      f.input :email
      f.input :phone
      f.input :company
      f.input :location
      f.input :message
    end
    f.inputs 'Atribuição MobiVolt AI (Chatbot)' do
      f.input :source, as: :select, collection: %w[portal mobivolt_ai]
      f.input :lead_score
      f.input :qualification_level, as: :select, collection: %w[quente morno frio]
      f.input :intent_type
      f.input :vertical, as: :select, collection: %w[solar electric_mobility]
      f.input :next_best_action
      f.input :ai_summary, as: :text
    end
    f.actions
  end
end
