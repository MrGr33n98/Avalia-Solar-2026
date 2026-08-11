# frozen_string_literal: true

ActiveAdmin.register_page 'IA Atendimento' do
  menu priority: 7, label: 'IA & Atendimento'

  content title: 'IA & Atendimento' do
    tabs = [
      ['Visão Geral', admin_ia_atendimento_path],
      ['Sessões de Chat', admin_chat_sessions_path],
      ['Leads Extraídos pela IA', admin_chat_leads_path],
      ['Inteligência (Insights)', admin_chat_insights_path],
      ['Base de Conhecimento', admin_knowledge_articles_path]
    ]

    div class: 'ia-atendimento-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    columns do
      column do
        panel 'Sessões de Conversa' do
          h2 number_with_delimiter(ChatSession.count, delimiter: '.')
          span 'Sessões totais do assistente MobiVolt AI'
        end
      end
      column do
        panel 'Leads Qualificados pela IA' do
          h2 number_with_delimiter(ChatLead.count, delimiter: '.')
          span 'Oportunidades de vendas capturadas'
        end
      end
      column do
        panel 'Artigos de Conhecimento' do
          h2 number_with_delimiter(KnowledgeArticle.count, delimiter: '.')
          span 'Documentos na base cognitiva'
        end
      end
      column do
        panel 'Total de Insights' do
          h2 number_with_delimiter(ChatInsight.count, delimiter: '.')
          span 'Análises de mercado acumuladas'
        end
      end
    end

    columns do
      column do
        panel 'Últimos Leads Qualificados' do
          table_for ChatLead.order(created_at: :desc).limit(10) do
            column('Nome') { |lead| lead.name.presence || 'Visitante Anônimo' }
            column('Telefone') { |lead| lead.phone }
            column('Temperatura') do |lead|
              temp = lead.lead_temperature.to_s.downcase
              color = case temp
                      when 'quente', 'muito_quente' then 'red'
                      when 'morno' then 'orange'
                      else 'blue'
                      end
              span lead.lead_temperature.to_s.upcase, style: "color: #{color}; font-weight: bold;"
            end
            column('Score') { |lead| lead.lead_score }
            column('Ações') { |lead| link_to 'Ver Lead', admin_chat_lead_path(lead) }
          end
        end
      end

      column do
        panel 'Sessões de Chat Recentes' do
          table_for ChatSession.order(updated_at: :desc).limit(10) do
            column('Sessão ID') { |session| session.id }
            column('Canal') { |session| session.channel }
            column('Mensagens') { |session| session.chat_messages.count }
            column('Última Atividade') { |session| session.updated_at&.strftime('%d/%m/%Y %H:%M') || '—' }
            column('Ações') { |session| link_to 'Abrir Histórico', admin_chat_session_path(session) }
          end
        end
      end
    end
  end
end
