ActiveAdmin.register BannerAuditLog do
  menu false
  actions :index, :show

  member_action :resolve, method: :post do
    log = resource
    log.update!(metadata_json: (log.metadata_json || {}).merge('status' => 'resolved', 'resolved_at' => Time.current.iso8601))
    BannerAuditLog.create!(
      auditable: log, action: 'suspicious_export_resolved',
      source: 'active_admin', actor: current_admin_user,
      metadata_json: { 'alert_id' => log.id, 'reason' => params[:reason].to_s.truncate(500) }
    )
    redirect_to resource_path(log), notice: 'Alerta marcado como resolvido.'
  end

  scope :todos, default: true
  scope :exportacoes do |logs|
    logs.where(action: 'export_incidents')
  end
  scope :ultimos_7_dias do |logs|
    logs.where('created_at >= ?', 7.days.ago)
  end
  scope :alertas_abertos do |logs|
    logs.where(action: 'suspicious_export_alert').where("metadata_json ->> 'status' = ?", 'open')
  end
  scope :alertas_resolvidos do |logs|
    logs.where(action: 'suspicious_export_alert').where("metadata_json ->> 'status' = ?", 'resolved')
  end

  sidebar 'Resumo operacional', only: :index do
    metrics = BannerAuditLogAnalytics.call(relation: scoped_collection)
    para "Total no período: #{metrics[:total]}"
    para "Exportações: #{metrics[:exports]}"
    if metrics[:suspicious_actors].any?
      h4 'Atores em atenção'
      metrics[:suspicious_actors].each do |actor|
        para "#{actor[:actor_type]} ##{actor[:actor_id]}: #{actor[:count]} exportações"
      end
    else
      para 'Nenhum comportamento acima do limiar configurado.'
    end
  end

  index do
    id_column
    column :auditable
    column :actor
    column :action do |log|
      status_tag log.action
    end
    column :source
    column :format do |log|
      log.metadata_json&.dig('format')
    end
    column :record_count do |log|
      log.metadata_json&.dig('record_count')
    end
    column :metadata_json
    column :ip_address
    column :created_at
    actions defaults: true do |log|
      if log.action == 'suspicious_export_alert' && log.metadata_json&.dig('status') == 'open'
        item 'Resolver', resolve_admin_banner_audit_log_path(log), method: :post
      end
    end
  end

  filter :auditable_type
  filter :auditable_id
  filter :actor_type
  filter :actor_id
  filter :action
  filter :source
  filter :created_at
  filter :metadata_json

  show do
    attributes_table do
      row :id
      row :auditable
      row :actor
      row :action do |log|
        status_tag log.action
      end
      row :source
      row :metadata_json do |log|
        pre JSON.pretty_generate(log.metadata_json || {})
      end
      row :ip_address
      row :created_at
    end
    if resource.action == 'suspicious_export_alert' && resource.metadata_json&.dig('status') == 'open'
      panel 'Resolver alerta' do
        active_admin_form_for resource, url: resolve_admin_banner_audit_log_path(resource), method: :post do |f|
          f.inputs do
            f.input :reason, as: :text, label: 'Motivo', input_html: { name: 'reason' }
          end
          f.actions { f.action :submit, label: 'Marcar como resolvido' }
        end
      end
    end
  end
end
