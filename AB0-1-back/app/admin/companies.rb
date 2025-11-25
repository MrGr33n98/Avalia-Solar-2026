# app/admin/companies.rb
ActiveAdmin.register Company do
  permit_params do
  permitted = [
    :name, :website, :phone, :address,
    :state, :city, :banner, :logo, :featured, :verified,
    :cnpj, :email, :whatsapp,
    :working_hours, :payment_methods,
    :certifications, :status, :founded_year, :employees_count,
    :awards, :partner_brands, :coverage_states, :coverage_cities,
    :latitude, :longitude, :minimum_ticket, :maximum_ticket,
    :financing_options, :response_time_sla, :languages,
    :email_public, :phone_alt, :facebook, :instagram,
    :linkedin, :description,
    project_types: [], services_offered: [], category_ids: []
  ]
  permitted << :plan_id if Company.column_names.include?('plan_id')
  permitted << :plan_status if Company.column_names.include?('plan_status')
  permitted << :whatsapp_enabled
  permitted << :whatsapp_url
  if Company.column_names.include?('whatsapp_button_style_json') || Company.new.respond_to?(:whatsapp_button_style_json)
    permitted + [whatsapp_button_style_json: [
      :variant, :bg_color, :text_color, :border_color,
      :hover_bg_color, :icon_color, :rounded_px
    ]]
  else
    permitted
  end
end

  form do |f|
    f.inputs 'Basic Information' do
      f.input :name
      f.input :description
      f.input :status, as: :select, collection: %w[active inactive pending blocked]
      f.input :featured
      f.input :verified
    end

    f.inputs 'Contact & Location' do
      f.input :email
      f.input :email_public
      f.input :phone
      f.input :phone_alt
      f.input :whatsapp
      f.input :address
      f.input :state
      f.input :city
      f.input :latitude
      f.input :longitude
    end

    f.inputs 'Business Details' do
      f.input :cnpj
      f.input :founded_year
      f.input :employees_count
      f.input :project_types, as: :check_boxes, collection: Company::PROJECT_TYPES, label: 'Tipos de Projetos'
      f.input :services_offered, as: :check_boxes, collection: Company::SERVICES_OFFERED, label: 'Serviços Oferecidos'
      f.input :working_hours
      f.input :payment_methods
      f.input :minimum_ticket
      f.input :maximum_ticket
      f.input :financing_options
      f.input :response_time_sla
      f.input :languages
    end

    f.inputs 'Coverage & Certifications' do
      f.input :coverage_states
      f.input :coverage_cities
      f.input :certifications
      f.input :awards
      f.input :partner_brands
    end

    f.inputs 'Social Media' do
      f.input :website
      f.input :facebook
      f.input :instagram
      f.input :linkedin
    end

    f.inputs 'Media' do
      f.input :banner, as: :file
      f.input :logo, as: :file
    end

    f.inputs 'CTAs' do
      f.input :whatsapp_enabled, as: :boolean, label: 'Ativar botão WhatsApp'
      f.input :whatsapp_url, label: 'URL do WhatsApp (ex: https://wa.me/...)'
    end

    if f.object.respond_to?(:whatsapp_button_style_json)
      f.inputs 'WhatsApp – Estilos do Botão' do
        styles = f.object.whatsapp_button_style_json || {}
        f.input :variant, as: :select,
                input_html: { name: 'company[whatsapp_button_style_json][variant]' },
                collection: [['Sólido', 'solid'], ['Contorno', 'outline']],
                include_blank: false,
                selected: styles['variant'] || 'solid',
                label: 'Estilo'
        f.input :bg_color, as: :string,
                input_html: { type: 'color', name: 'company[whatsapp_button_style_json][bg_color]', value: styles['bg_color'] || '#16a34a' },
                label: 'Cor de fundo'
        f.input :hover_bg_color, as: :string,
                input_html: { type: 'color', name: 'company[whatsapp_button_style_json][hover_bg_color]', value: styles['hover_bg_color'] || '#15803d' },
                label: 'Cor de fundo (hover)'
        f.input :text_color, as: :string,
                input_html: { type: 'color', name: 'company[whatsapp_button_style_json][text_color]', value: styles['text_color'] || '#ffffff' },
                label: 'Cor do texto'
        f.input :border_color, as: :string,
                input_html: { type: 'color', name: 'company[whatsapp_button_style_json][border_color]', value: styles['border_color'] || '#16a34a' },
                label: 'Cor da borda'
        f.input :icon_color, as: :string,
                input_html: { type: 'color', name: 'company[whatsapp_button_style_json][icon_color]', value: styles['icon_color'] || '#ffffff' },
                label: 'Cor do ícone'
        f.input :rounded_px, as: :number,
                input_html: { name: 'company[whatsapp_button_style_json][rounded_px]', value: styles['rounded_px'] || 12, min: 0, max: 32 },
                label: 'Arredondamento (px)'
      end
    end

    if Company.column_names.include?('plan_id') || Company.column_names.include?('plan_status')
      f.inputs 'Plano' do
        if Company.column_names.include?('plan_id')
          f.input :plan_id, as: :select, collection: Plan.all.map { |p| [p.name, p.id] }, include_blank: true
        end
        if Company.column_names.include?('plan_status')
          f.input :plan_status, as: :select, collection: %w[active inactive trial expired]
        end
      end
    end

    f.inputs 'Categories' do
      f.input :categories, as: :check_boxes
    end

    f.actions
  end

  show do
    attributes_table do
      row :name
      row :cnpj
      row :email
      row :website
      row :phone
      row :whatsapp
      row :address
      row :state
      row :city
      row :working_hours
      row :payment_methods
      row :project_types
      row :services_offered
      row :certifications
      row :featured
      row :verified
      row :status
      row :average_rating
      row :reviews_count
      row :categories do |company|
        company.categories.pluck(:name).join(', ')
      end
      row :banner do |company|
        if company.banner.attached?
          image_tag(url_for(company.banner), style: 'max-width: 300px')
        else
          content_tag(:span, 'Sem banner')
        end
      end
      row :logo do |company|
        if company.logo.attached?
          image_tag(url_for(company.logo), style: 'max-width: 200px')
        else
          content_tag(:span, 'Sem logo')
        end
      end
    end
  end

  filter :name
  filter :state
  filter :city
  filter :featured
  filter :verified
  filter :status
  filter :created_at
  filter :categories

  index do
    selectable_column
    id_column
    column :name
    column :state
    column :city
    column :featured
    column :verified
    column :status
    column :plan_status if Company.column_names.include?('plan_status')
    column :plan if Company.reflect_on_association(:plan)
    column :created_at
    actions
  end

  scope('Pendentes') { |scope| scope.where(status: 'pending') }

  controller do
    def update
      super
    end

    def destroy
      company = Company.find_by(id: params[:id])
      if company
        super
      else
        redirect_to collection_path, notice: 'Empresa já excluída ou não encontrada.'
      end
    end
  end

  batch_action :ativar, confirm: 'Ativar empresas selecionadas?' do |ids|
    batch_action_collection.where(id: ids).update_all(status: 'active')
    redirect_to collection_path, notice: 'Empresas ativadas.'
  end
end
