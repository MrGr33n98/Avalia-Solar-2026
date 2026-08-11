# frozen_string_literal: true

ActiveAdmin.register ChatLead do
  menu false

  actions :index, :show

  filter :name
  filter :email
  filter :phone
  filter :city
  filter :state
  filter :vertical, as: :select, collection: ChatLead::VERTICALS
  filter :intent, as: :select, collection: ChatLead::INTENTS
  filter :lead_temperature, as: :select, collection: ChatLead::TEMPERATURES
  filter :sales_status, as: :select, collection: ChatLead::SALES_STATUSES
  filter :lead_score
  filter :created_at

  scope :all, default: true
  scope :actionable
  scope :hot
  scope :not_spam

  member_action :change_status, method: :post do
    new_status = params[:status]
    if ChatLead::SALES_STATUSES.include?(new_status)
      resource.change_status!(new_status, performed_by: current_admin_user,
                                          notes: "Alterado via painel ActiveAdmin por #{current_admin_user.email}")
      redirect_to admin_chat_lead_path(resource), notice: "Status do lead atualizado para '#{new_status}' com sucesso!"
    else
      redirect_to admin_chat_lead_path(resource), alert: 'Status inválido!'
    end
  end

  index do
    selectable_column
    id_column
    column :name
    column :contact do |l|
      div do
        div { l.phone }
        div { l.email }
      end
    end
    column :location do |l|
      [l.city, l.state].compact.join('/')
    end
    column :vertical do |l|
      status_tag l.vertical, class: l.vertical == 'solar' ? 'ok' : 'warning'
    end
    column :intent do |l|
      l.intent&.humanize
    end
    column :score, sortable: :lead_score do |l|
      "#{l.lead_score} pts"
    end
    column :temperature, sortable: :lead_temperature do |l|
      status_tag "#{l.temperature_emoji} #{l.lead_temperature}", class: case l.lead_temperature
                                                                        when 'muito_quente' then 'ok'
                                                                        when 'quente' then 'ok'
                                                                        when 'morno' then 'warning'
                                                                        else 'error'
                                                                        end
    end
    column :status, sortable: :sales_status do |l|
      status_tag l.sales_status, class: case l.sales_status
                                        when 'converted' then 'ok'
                                        when 'new', 'qualified' then 'warning'
                                        when 'spam', 'lost' then 'error'
                                        else 'light'
                                        end
    end
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :chat_session do |l|
        link_to "Sessão ##{l.chat_session_id}", admin_chat_session_path(l.chat_session)
      end
      row :name
      row :phone
      row :email
      row :city
      row :state
      row :vertical
      row :intent
      row :project_type
      row :monthly_bill do |l|
        number_to_currency(l.monthly_bill, unit: 'R$ ', separator: ',', delimiter: '.') if l.monthly_bill.present?
      end
      row :lead_score
      row :lead_temperature do |l|
        "#{l.temperature_emoji} #{l.lead_temperature}"
      end
      row :sales_status do |l|
        status_tag l.sales_status
      end
      row :consent_given do |l|
        status_tag(l.consent_given ? 'Aceito' : 'Não Aceito', class: l.consent_given ? 'ok' : 'error')
      end
      row :consent_given_at
      row :source_page
      row :utm_source
      row :utm_medium
      row :utm_campaign
      row :recommended_next_action
      row :summary do |l|
        div style: 'white-space: pre-wrap;' do
          l.summary
        end
      end
      row :pain_points do |l|
        pre { JSON.pretty_generate(l.pain_points) } if l.pain_points.present?
      end
      row :objections do |l|
        pre { JSON.pretty_generate(l.objections) } if l.objections.present?
      end
      row :metadata do |l|
        pre { JSON.pretty_generate(l.metadata) } if l.metadata.present?
      end
    end

    panel 'Ações de Vendas' do
      div class: 'action_items' do
        span class: 'action_item' do
          link_to 'Qualificar Lead', change_status_admin_chat_lead_path(resource, status: 'qualified'), method: :post,
                                                                                                        class: 'button'
        end
        span class: 'action_item' do
          link_to 'Marcar como Contatado', change_status_admin_chat_lead_path(resource, status: 'contacted'),
                  method: :post, class: 'button'
        end
        span class: 'action_item' do
          link_to 'Proposta Enviada', change_status_admin_chat_lead_path(resource, status: 'proposal_sent'),
                  method: :post, class: 'button'
        end
        span class: 'action_item' do
          link_to 'Converter (Venda)', change_status_admin_chat_lead_path(resource, status: 'converted'),
                  method: :post, class: 'button ok'
        end
        span class: 'action_item' do
          link_to 'Perdido', change_status_admin_chat_lead_path(resource, status: 'lost'), method: :post,
                                                                                           class: 'button error'
        end
        span class: 'action_item' do
          link_to 'Marcar como SPAM', change_status_admin_chat_lead_path(resource, status: 'spam'), method: :post,
                                                                                                    class: 'button error'
        end
      end
    end

    panel 'Histórico de Atividades do Lead' do
      table_for resource.chat_lead_activities.recent do
        column :id
        column :activity_type
        column :description
        column :old_status
        column :new_status
        column :performed_by_id do |a|
          AdminUser.find_by(id: a.performed_by_id)&.email || 'Automático/Sistema'
        end
        column :created_at
      end
    end
  end
end
