# frozen_string_literal: true

ActiveAdmin.register ChatSession do
  menu false

  actions :index, :show

  filter :visitor_id
  filter :status, as: :select, collection: ChatSession.statuses.keys
  filter :vertical
  filter :source_page
  filter :utm_source
  filter :utm_campaign
  filter :created_at

  scope :all, default: true
  scope(:active) { |scope| scope.where(status: 'active') }
  scope(:with_leads) { |scope| scope.joins(:chat_lead) }

  index do
    selectable_column
    id_column
    column :visitor_id do |s|
      (s.visitor_id || 'Visitante não identificado').truncate(16)
    end
    column :status do |s|
      status_tag s.status, class: s.status == 'active' ? 'ok' : 'warning'
    end
    column :vertical
    column :source_page do |s|
      s.source_page.to_s.truncate(40)
    end
    column :message_count
    column :utm_source
    column 'Lead?' do |s|
      s.chat_lead.present? ? status_tag('Sim', class: 'ok') : status_tag('Não', class: 'warning')
    end
    column :started_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :visitor_id
      row :user
      row :status do |s|
        status_tag s.status
      end
      row :vertical
      row :page_url
      row :source_page
      row :referrer
      row :utm_source
      row :utm_medium
      row :utm_campaign
      row :message_count
      row :started_at
      row :ended_at
      row :last_message_at
      row :metadata do |s|
        pre { JSON.pretty_generate(s.metadata) } if s.metadata.present?
      end
    end

    panel 'Mensagens da Conversa' do
      table_for resource.chat_messages.chronological do
        column :id
        column :role do |m|
          case m.role
          when 'user' then status_tag('Usuário', class: 'ok')
          when 'assistant' then status_tag('IA', class: 'warning')
          else status_tag(m.role)
          end
        end
        column :content do |m|
          div style: 'max-width:600px; white-space:pre-wrap;' do
            m.content.truncate(500)
          end
        end
        column :intent_detected
        column :model
        column :latency_ms do |m|
          "#{m.latency_ms}ms" if m.latency_ms
        end
        column :feedback do |m|
          case m.feedback
          when 1 then '👍'
          when -1 then '👎'
          else '—'
          end
        end
        column :created_at
      end
    end

    if resource.chat_lead.present?
      panel 'Lead Capturado' do
        lead = resource.chat_lead
        attributes_table_for lead do
          row :id
          row :name
          row :phone
          row :email
          row(:city) { [lead.city, lead.state].compact.join('/') }
          row :vertical
          row :intent
          row :lead_score
          row(:lead_temperature) { "#{lead.temperature_emoji} #{lead.lead_temperature}" }
          row(:sales_status) { status_tag lead.sales_status }
          row :recommended_next_action
          row :summary
        end
      end
    end
  end
end
