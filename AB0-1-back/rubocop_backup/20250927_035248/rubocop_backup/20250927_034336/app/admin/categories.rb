require 'English'
ActiveAdmin.register Category, namespace: :admin do
  # Permit params for categories
  permit_params :name, :seo_url, :seo_title, :short_description, :description, :parent_id, :kind, :status, :featured,
                :banner

  # Add CSV import action
  action_item :import_csv, only: :index do
    link_to 'Import CSV', upload_csv_admin_categories_path
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
          parent_id: row['parent_id'].present? ? row['parent_id'] : nil,
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
  filter :description
  filter :featured
  filter :status
  filter :created_at

  form do |f|
    f.inputs do
      f.input :name
      f.input :description
      f.input :short_description
      f.input :seo_url
      f.input :seo_title
      f.input :featured
      f.input :status, as: :select, collection: %w[active inactive]
      f.input :kind, as: :select, collection: %w[main sub]
      f.input :parent_id, as: :select, collection: Category.where.not(id: f.object.id).map { |c|
        [c.name, c.id]
      }, include_blank: 'None'

      # Add banner image upload
      f.input :banner, as: :file,
                       hint: f.object.banner.attached? ? image_tag(url_for(f.object.banner), style: 'max-width: 300px') : content_tag(:span, 'No banner uploaded yet')

      # Add companies association
      f.input :companies, as: :check_boxes
    end
    f.actions
  end

  show do
    attributes_table do
      row :name
      row :description
      row :short_description
      row :seo_url
      row :seo_title
      row :featured
      row :status
      row :kind
      row :parent_id
      row :created_at
      row :updated_at

      # Display banner image
      row :banner do |category|
        if category.banner.attached?
          image_tag url_for(category.banner), style: 'max-width: 300px'
        else
          'No banner uploaded'
        end
      end

      # Display associated companies
      row :companies do |category|
        category.companies.map do |company|
          link_to company.name, admin_company_path(company)
        end.join(', ').html_safe
      end
    end
  end

  index do
    selectable_column
    id_column
    column :name
    column :description
    column :featured
    column :status
    column :kind
    column :created_at

    # Show company count in the index
    column 'Companies' do |category|
      link_to "#{category.companies.count} companies", admin_category_path(category)
    end

    actions
  end
end
