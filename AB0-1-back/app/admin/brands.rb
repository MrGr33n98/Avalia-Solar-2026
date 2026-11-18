# frozen_string_literal: true

ActiveAdmin.register Brand do
  menu label: 'Fabricantes (Marcas)', parent: 'Reviews', priority: 3

  permit_params :name, :slug, :status, :logo, aliases: []

  controller do
    def scoped_collection
      super.with_attached_logo
    end

    def update
      normalize_aliases_param
      super
    end

    def create
      normalize_aliases_param
      super
    end

    private

    def normalize_aliases_param
      return unless params[:brand] && params[:brand][:aliases_raw].present?

      raw = params[:brand].delete(:aliases_raw)
      params[:brand][:aliases] = raw.is_a?(String) ? raw.split(',').map(&:strip).reject(&:blank?) : Array(raw)
    end
  end

  filter :name
  filter :slug
  filter :status, as: :select, collection: Brand::STATUSES
  filter :created_at

  index do
    selectable_column
    id_column
    column 'Logo' do |brand|
      if brand.logo.attached?
        image_tag url_for(brand.logo), style: 'max-height: 36px; max-width: 60px; object-fit: contain; border-radius: 4px; border: 1px solid #E0E0E0; padding: 2px;'
      else
        span brand.initials, style: 'display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #F4F7FB; color: #17468D; font-weight: bold; border-radius: 50%; font-size: 11px; border: 1px solid #D0D7DE;'
      end
    end
    column :name
    column :slug
    column 'Aliases' do |brand|
      Array(brand.aliases).join(', ')
    end
    column :status do |brand|
      status_tag brand.status, class: brand.status == 'active' ? 'yes' : 'no'
    end
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :id
      row :name
      row :slug
      row :status do |brand|
        status_tag brand.status
      end
      row 'Logo' do |brand|
        if brand.logo.attached?
          image_tag url_for(brand.logo), style: 'max-height: 80px; max-width: 120px; object-fit: contain;'
        else
          span "Sem logo oficial (usando monograma: #{brand.initials})", class: 'empty'
        end
      end
      row 'Aliases' do |brand|
        Array(brand.aliases).join(', ')
      end
      row :created_at
      row :updated_at
    end
  end

  form html: { multipart: true } do |f|
    f.inputs 'Informações do Fabricante' do
      f.input :name, label: 'Nome Oficial da Marca'
      f.input :slug, hint: 'Deixe em branco para gerar automaticamente a partir do nome'
      f.input :status, as: :select, collection: Brand::STATUSES
      f.input :aliases_raw, as: :string, label: 'Aliases (separados por vírgula)', input_html: { value: Array(f.object.aliases).join(', ') }
    end

    f.inputs 'Identidade Visual (Logo Curado)' do
      f.input :logo, as: :file,
                     input_html: { accept: 'image/png,image/jpeg,image/webp' },
                     hint: f.object.logo.attached? ? image_tag(url_for(f.object.logo), style: 'max-height: 60px; max-width: 120px; object-fit: contain; display: block; margin-bottom: 8px;') : 'Formatos aceitos: PNG, JPG, WEBP. Tamanho máximo: 2MB. Dimensões recomendadas: até 2048x2048px.'
    end

    f.actions
  end
end
