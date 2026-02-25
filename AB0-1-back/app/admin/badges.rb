ActiveAdmin.register Badge do
  permit_params :name, :description, :position, :year, :edition, :category_label, :active, :public_slug, :image, company_ids: []

  index do
    selectable_column
    id_column
    column :image do |badge|
      if badge.image.attached?
        image_tag url_for(badge.image), style: 'height: 50px; width: auto;'
      end
    end
    column :name
    column :category_label
    column :year
    column :edition
    column :active
    column :companies_count do |badge|
      badge.companies.count
    end
    actions
  end

  filter :name
  filter :category_label
  filter :year
  filter :active

  form html: { multipart: true } do |f|
    f.semantic_errors
    f.inputs 'Badge Details' do
      f.input :name
      f.input :public_slug, hint: 'Deixe em branco para gerar automaticamente baseado no nome'
      f.input :description, input_html: { rows: 3 }
      f.input :category_label, label: 'Categoria (Ex: Top Premium)'
      f.input :year, as: :number
      f.input :edition, as: :number
      f.input :position
      f.input :active
    end

    f.inputs 'Visual Asset' do
      f.input :image, as: :file, hint: f.object.image.attached? ? image_tag(url_for(f.object.image), style: 'max-width: 150px') : 'Anexe uma imagem PNG/JPG/WEBP (Max 2MB)'
    end

    f.inputs 'Company Assignments' do
      f.input :companies, 
              as: :select, 
              multiple: true, 
              collection: Company.order(:name).map { |c| [c.name, c.id] },
              input_html: { class: 'select2-input', style: 'width: 100%' },
              label: 'Empresas Atribuidas (Selecione uma ou mais)'
    end

    f.actions
  end

  show do
    attributes_table do
      row :name
      row :public_slug
      row :description
      row :category_label
      row :year
      row :edition
      row :position
      row :active
      row :image do |badge|
        if badge.image.attached?
          image_tag url_for(badge.image), style: 'max-width: 300px'
        end
      end
      row :public_url do |badge|
        url = "#{ENV.fetch('FRONTEND_URL', 'https://avaliasolar.com.br')}/badges/#{badge.public_slug}"
        link_to url, url, target: '_blank'
      end
      row :created_at
      row :updated_at
    end

    panel 'Assigned Companies' do
      table_for badge.companies do
        column :id
        column :name do |company|
          link_to company.name, admin_company_path(company)
        end
        column :state
        column :city
        column :status
      end
    end
  end
end
