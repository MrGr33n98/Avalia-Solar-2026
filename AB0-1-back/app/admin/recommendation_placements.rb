# frozen_string_literal: true

ActiveAdmin.register RecommendationPlacement do
  menu label: 'Placements de Recomendação', parent: 'Configurações', priority: 25

  permit_params :company_id, :category_id, :placement_type, :state_code,
                :slot_position, :starts_at, :ends_at, :max_impressions,
                :current_impressions, :active

  scope :all, default: true
  scope('Ativos') { |scope| scope.active_now }
  scope('Agendados') { |scope| scope.where('starts_at > ?', Time.current) }
  scope('Expirados') { |scope| scope.where('ends_at < ?', Time.current) }
  scope('Patrocinados') { |scope| scope.sponsored }
  scope('Fixados') { |scope| scope.pinned }

  filter :company
  filter :category
  filter :placement_type, as: :select, collection: RecommendationPlacement::PLACEMENT_TYPES
  filter :state_code
  filter :active
  filter :starts_at
  filter :ends_at

  index do
    selectable_column
    id_column
    column :company
    column :placement_type do |r|
      status_tag(r.placement_type, class: r.placement_type == 'sponsored' ? 'ok' : 'warn')
    end
    column :escopo do |r|
      [r.state_code.presence || 'Nacional', r.category&.name].compact.join(' / ')
    end
    column :slot_position
    column :período do |r|
      "#{r.starts_at&.strftime('%d/%m/%Y %H:%M')} até #{r.ends_at&.strftime('%d/%m/%Y %H:%M')}"
    end
    column :status do |r|
      if r.active_for?
        status_tag('Ativo', class: 'ok')
      elsif r.expired?
        status_tag('Expirado', class: 'error')
      else
        status_tag('Inativo', class: 'warn')
      end
    end
    column :impressões do |r|
      "#{r.current_impressions} / #{r.max_impressions.presence || '∞'}"
    end
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :company
      row :placement_type
      row :category
      row :state_code
      row :slot_position
      row :starts_at
      row :ends_at
      row :max_impressions
      row :current_impressions
      row :active
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.inputs 'Dados do Placement Comercial' do
      f.input :company, collection: Company.active.order(:name), include_blank: false
      f.input :placement_type, as: :select, collection: [['Patrocinado (sponsored)', 'sponsored'], ['Fixado (pinned)', 'pinned']], include_blank: false
      f.input :category, collection: Category.order(:name), include_blank: 'Todas as categorias'
      f.input :state_code, hint: 'UF com 2 letras (ex: SC, SP). Deixe em branco para abrangência nacional.'
      f.input :slot_position, input_html: { min: 1, value: f.object.slot_position || 1 }, hint: 'Posição do slot no grid de recomendações (ex: 1, 2)'
      f.input :starts_at, as: :datetime_picker
      f.input :ends_at, as: :datetime_picker
      f.input :max_impressions, hint: 'Limite opcional de impressões totais'
      f.input :active, hint: 'Marque para manter o agendamento habilitado'
    end
    f.actions
  end

  collection_action :preview, method: :get do
    state = params[:state].presence
    city = params[:city].presence
    category_slug = params[:category_slug].presence
    segment = params[:segment].presence

    context = Recommendation::ContextBuilder.call(
      params: { city: city, state: state, category_slug: category_slug, segment: segment }
    )

    results = Recommendation::Engine.call(context: context, limit: 8)

    @preview_data = {
      context: context,
      results: results
    }

    render layout: 'active_admin'
  end
end
