ActiveAdmin.register Campaign do
  menu parent: 'Publicidade & Campanhas', priority: 8
  
  permit_params :name, :description, :start_date, :end_date, :budget, :company_id, :target_url, :priority, :image

  index do
    selectable_column
    id_column
    column :name
    column :company
    column :budget do |c|
      number_to_currency(c.budget, unit: 'R$ ', separator: ',', delimiter: '.')
    end
    column :priority
    column :start_date
    column :end_date
    column :active? do |c|
      c.start_date.nil? || (c.start_date <= Date.today && (c.end_date.nil? || c.end_date >= Date.today))
    end
    actions
  end

  show do
    attributes_table do
      row :id
      row :name
      row :description
      row :company
      row :target_url
      row :priority
      row :budget do |c|
        number_to_currency(c.budget, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row :start_date
      row :end_date
      row :image do |c|
        if c.image.attached?
          image_tag(Rails.application.routes.url_helpers.rails_blob_path(c.image, only_path: true), style: 'max-width: 300px; height: auto;')
        else
          span 'Nenhuma imagem cadastrada'
        end
      end
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.semantic_errors *f.object.errors.attribute_names
    f.inputs 'Detalhes da Campanha' do
      f.input :name, label: 'Nome da Campanha'
      f.input :description, as: :text, label: 'Descrição'
      f.input :company, label: 'Empresa Associada'
      f.input :target_url, label: 'URL de Destino (Link do Click)', placeholder: 'https://...'
      f.input :priority, label: 'Prioridade (maior valor = mais prioritário)'
      f.input :budget, label: 'Investimento/Orçamento'
      f.input :start_date, as: :datepicker, label: 'Data de Início'
      f.input :end_date, as: :datepicker, label: 'Data de Fim'
      f.input :image, as: :file, label: 'Banner Criativo (Imagem)', hint: f.object.image.attached? ? image_tag(Rails.application.routes.url_helpers.rails_blob_path(f.object.image, only_path: true), style: 'max-width: 200px; height: auto;') : nil
    end
    f.actions
  end
end
