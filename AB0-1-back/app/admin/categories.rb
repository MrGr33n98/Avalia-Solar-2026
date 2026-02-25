require 'English'
ActiveAdmin.register Category, namespace: :admin do
  # Permit params for categories
  permit_params :name, :seo_url, :seo_title, :short_description, :description, :parent_id, :kind, :status, :featured,
                :banner, :icon, :permissions_config, company_ids: [], product_ids: [],
                                                     badges_attributes: %i[id name description year badge_image _destroy]

  # Custom action to clear cache after update
  after_save do |category|
    category.clear_query_cache! if category.respond_to?(:clear_query_cache!)
  end

  # Add CSV import action
  action_item :import_csv, only: :index do
    link_to 'Import CSV', upload_csv_admin_categories_path, class: 'button'
  end

  collection_action :upload_csv, method: :get do
    render 'admin/csv/upload_csv'
  end

  collection_action :import_csv, method: :post do
    if params[:csv_file].nil?
      redirect_to upload_csv_admin_categories_path, alert: 'No file selected'
      return
    end

    success_count = 0
    errors = []

    begin
      CSV.foreach(params[:csv_file].path, headers: true) do |row|
        category = Category.new(
          name: row['name'],
          seo_url: row['seo_url'] || row['name'].parameterize,
          seo_title: row['seo_title'],
          short_description: row['short_description'],
          description: row['description'],
          kind: row['kind'] || 'product',
          status: row['status'] || 'active',
          featured: row['featured'] == 'true'
        )

        if category.save
          success_count += 1
        else
          errors << "Row #{$INPUT_LINE_NUMBER + 1}: #{category.errors.full_messages.join(', ')}"
        end
      end

      if errors.empty?
        redirect_to admin_categories_path, notice: "Successfully imported #{success_count} categories"
      else
        redirect_to admin_categories_path,
                    alert: "Imported #{success_count} categories with #{errors.count} errors: #{errors.join('; ')}"
      end
    rescue StandardError => e
      redirect_to admin_categories_path, alert: "Import failed: #{e.message}"
    end
  end

  # Define filters
  filter :name
  filter :parent
  filter :kind
  filter :featured
  filter :status
  filter :companies_count
  filter :products_count
  filter :average_rating
  filter :average_price
  filter :views_count
  filter :created_at

  # Enhanced form
  form do |f|
    f.inputs 'Basic Information' do
      f.input :name
      f.input :short_description, label: 'Meta Description / Short Description', hint: 'Used for SEO and card previews'
      f.input :description, as: :text, input_html: { rows: 10 }
      f.input :seo_url, hint: 'URL-friendly slug (leave blank to auto-generate)'
      f.input :seo_title, hint: 'SEO title for search engines'
    end

    f.inputs 'Settings' do
      f.input :status, as: :select, collection: [%w[Active active], %w[Inactive inactive]]
      f.input :kind, as: :select, collection: [['Main Category', 'main'], ['Sub Category', 'sub']]
      f.input :parent,
              as: :select,
              collection: Category.where.not(id: f.object.id).order(:name),
              include_blank: true,
              hint: 'Selecione a categoria pai para criar uma subcategoria (opcional).'
      f.input :featured, hint: 'Display in featured categories section'
    end

    f.inputs 'Assets' do
      f.input :icon, as: :file,
                     hint: f.object.icon.attached? ? image_tag(url_for(f.object.icon), size: '50x50') : 'No icon'
      f.input :banner, as: :file, hint: (
        hint_text = 'Requisitos técnicos: 1200x800px (Proporção 3:2), Formato PNG ou JPG, Máximo de 500KB. Mantenha conteúdo importante dentro de 1000x700px.'
        if f.object.banner.attached?
          content_tag(:div) do
            concat image_tag(url_for(f.object.banner), style: 'max-width: 300px; display: block; margin-bottom: 10px;')
            concat content_tag(:span, hint_text, style: 'font-size: 0.9em; color: #666;')
          end
        else
          hint_text
        end
      ).html_safe
    end

    f.inputs 'Badges' do
      f.has_many :badges, allow_destroy: true, new_record: true do |b|
        b.input :name
        b.input :description
        b.input :year
        b.input :badge_image, as: :file,
                              hint: (b.object&.badge_image&.attached? ? image_tag(url_for(b.object.badge_image), size: '50x50') : 'No image')
      end
    end

    f.inputs 'Associações' do
      f.input :companies, as: :check_boxes,
                          collection: Company.order(:name).map { |c| [c.name, c.id] },
                          label: 'Empresas nesta Categoria'
    end

    f.inputs 'Configurações de Permissões' do
      f.input :permissions_config, as: :text,
                                   label: 'Configurações de Permissões (JSON)',
                                   hint: 'Formato JSON: { "can_see_leads": true, "can_manage_products": true }. Essas configurações definem o que empresas nesta categoria podem acessar.',
                                   input_html: {
                                     value: f.object.permissions_config.present? ? f.object.permissions_config.to_json : {}.to_json,
                                     rows: 5
                                   }
    end

    f.actions
  end

  # Enhanced index page with hierarchy and metrics
  index do
    selectable_column
    id_column
    column :icon do |category|
      image_tag url_for(category.icon), size: '30x30' if category.icon.attached?
    end
    column :name do |category|
      indent = (category.respond_to?(:depth) ? category.depth : 0) * 2
      span style: "padding-left: #{indent}em" do
        link_to category.name, admin_category_path(category)
      end
    end
    column :companies_count
    column :products_count
    column :average_rating do |category|
      if category.respond_to?(:average_rating) && category.average_rating.present?
        number_with_precision(category.average_rating,
                              precision: 1)
      end
    end
    column :average_price do |category|
      if category.respond_to?(:average_price) && category.average_price.present?
        number_to_currency(category.average_price,
                           unit: 'R$ ')
      end
    end
    column :views_count
    column :status do |category|
      status_tag category.status
    end
    column :featured
    column :created_at
    actions
  end

  # Enhanced show page
  show do
    attributes_table do
      row :name
      row :parent do |category|
        next unless category.parent

        link_to category.parent.name, admin_category_path(category.parent)
      end
      row :short_description
      row :description do |category|
        raw category.description
      end
      row :seo_url do |category|
        link_to category.seo_url, "/categories/#{category.seo_url}", target: '_blank'
      end
      row :seo_title
      row :featured do |category|
        status_tag(category.featured ? 'Yes' : 'No', class: (category.featured ? 'ok' : 'error'))
      end
      row :status do |category|
        status_tag(category.status == 'active' ? 'Active' : 'Inactive',
                   class: (category.status == 'active' ? 'ok' : 'error'))
      end
      row :kind
      row :companies_count
      row :products_count
      row :average_rating
      row :average_price do |category|
        number_to_currency(category.average_price, unit: 'R$ ')
      end
      row :views_count
      row :created_at
      row :updated_at
    end

    if category.children.any?
      panel 'Subcategorias' do
        table_for category.children.order(:name) do
          column :name do |child|
            link_to child.name, admin_category_path(child)
          end
          column :seo_url
          column :status do |child|
            status_tag child.status
          end
          column :featured
        end
      end
    end

    panel 'Assets' do
      div style: 'display: flex; gap: 20px;' do
        if category.icon.attached?
          div do
            h4 'Icon'
            image_tag url_for(category.icon), size: '100x100'
          end
        end
        if category.banner.attached?
          div do
            h4 'Banner'
            image_tag url_for(category.banner), style: 'max-width: 400px;'
          end
        end
      end
    end
  end
end
