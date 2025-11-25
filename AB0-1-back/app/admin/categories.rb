require 'English'
ActiveAdmin.register Category, namespace: :admin do
  # Permit params for categories
  permit_params :name, :seo_url, :seo_title, :short_description, :description, :parent_id, :kind, :status, :featured,
                :banner, company_ids: [], product_ids: []

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

  # Enhanced form with better banner management
  form do |f|
    f.inputs 'Basic Information' do
      f.input :name
      f.input :short_description, hint: 'Brief description for cards and previews'
      f.input :description, as: :text, input_html: { rows: 10 }
      f.input :seo_url, hint: 'URL-friendly slug (leave blank to auto-generate)'
      f.input :seo_title, hint: 'SEO title for search engines'
    end

    f.inputs 'Category Settings' do
      f.input :featured, hint: 'Display in featured categories section'
      f.input :status, as: :select, collection: [['Active', 'active'], ['Inactive', 'inactive']]
      f.input :kind, as: :select, collection: [['Main Category', 'main'], ['Sub Category', 'sub']]
      f.input :parent_id, as: :select, 
              collection: Category.where.not(id: f.object.id).where(kind: 'main').map { |c| [c.name, c.id] }, 
              include_blank: 'None (Main Category)',
              hint: 'Select parent category if this is a sub-category'
    end

    f.inputs 'Banner Image' do
      if f.object.banner.attached?
        div class: 'current-banner-preview' do
          h4 'Current Banner:'
          image_tag url_for(f.object.banner), style: 'max-width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 10px 0;'
          div style: 'margin-top: 10px;' do
            span 'Banner URL: ', style: 'font-weight: bold;'
            span f.object.banner_url, style: 'font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 4px;'
          end
        end
      end
      
      f.input :banner, as: :file,
              hint: 'Recommended size: 1200x400px (3:1 aspect ratio). Formats: JPG, PNG, WebP. Max size: 5MB',
              input_html: { accept: 'image/*' }
      
      if f.object.banner.attached?
        div style: 'margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;' do
          strong 'Note: '
          span 'Uploading a new image will replace the current banner.'
        end
      end
    end

    f.inputs 'Associations' do
      f.input :companies, as: :check_boxes, 
              collection: Company.order(:name).map { |c| [c.name, c.id] }
      f.input :products, as: :check_boxes,
              collection: Product.order(:name).map { |p| [p.name, p.id] }
    end

    f.actions do
      f.action :submit
      f.cancel_link admin_categories_path
    end
  end

  # Enhanced show page
  show do
    attributes_table do
      row :name
      row :short_description
      row :description do |category|
        raw category.description
      end
      row :seo_url do |category|
        link_to "/categories/#{category.seo_url}", "/categories/#{category.seo_url}", target: '_blank'
      end
      row :seo_title
      row :featured do |category|
        status_tag(category.featured ? 'Yes' : 'No', class: (category.featured ? 'ok' : 'error'))
      end
      row :status do |category|
        status_tag(category.status == 'active' ? 'Active' : 'Inactive', class: (category.status == 'active' ? 'ok' : 'error'))
      end
      row :kind do |category|
        status_tag(category.kind == 'main' ? 'Main' : 'Sub', class: (category.kind == 'main' ? 'ok' : 'warning'))
      end
      row :parent do |category|
        category.parent_id ? link_to(Category.find(category.parent_id).name, admin_category_path(category.parent_id)) : 'None'
      end
      row :created_at
      row :updated_at
    end

    panel 'Banner Image' do
      if category.banner.attached?
        div class: 'banner-display' do
          image_tag url_for(category.banner), 
                    style: 'width: 100%; max-width: 800px; height: 250px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'
          div style: 'margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;' do
            h4 'Banner Details:'
            table_for [category.banner] do
              column('File Name') { |b| b.filename }
              column('Size') { |b| number_to_human_size(b.byte_size) }
              column('Content Type') { |b| b.content_type }
              column('URL') { |b| link_to 'View Full Size', url_for(b), target: '_blank' }
            end
          end
        end
      else
        div class: 'no-banner-message', style: 'text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;' do
          h3 style: 'color: #6c757d; margin-bottom: 10px;' do
            'No Banner Uploaded'
          end
          p style: 'color: #868e96; margin-bottom: 20px;' do
            'Upload a banner image to enhance the category page appearance'
          end
          link_to 'Edit Category', edit_admin_category_path(category), class: 'button'
        end
      end
    end

    panel 'Associated Companies' do
      if category.companies.any?
        table_for category.companies.order(:name) do
          column('Name') { |company| link_to company.name, admin_company_path(company) }
          column('Description') { |company| truncate(company.description || '', length: 100) }
          column('Status') { |company| 
            status_tag(company.status == 'active' ? 'Active' : 'Inactive', 
                       class: (company.status == 'active' ? 'ok' : 'error'))
          }
        end
      else
        div 'No companies associated with this category'
      end
    end

    panel 'Associated Products' do
      if category.products.any?
        table_for category.products.order(:name) do
          column('Name') { |product| link_to product.name, admin_product_path(product) }
          column('Price') { |product| number_to_currency(product.price) if product.price }
          column('Status') { |product| 
            status_tag(product.status == 'active' ? 'Active' : 'Inactive', 
                       class: (product.status == 'active' ? 'ok' : 'error'))
          }
        end
      else
        div 'No products associated with this category'
      end
    end
  end

  # Enhanced index with banner preview
  index do
    selectable_column
    id_column
    
    column 'Banner' do |category|
      if category.banner.attached?
        image_tag url_for(category.banner), style: 'width: 60px; height: 40px; object-fit: cover; border-radius: 4px;'
      else
        span 'No banner', style: 'color: #999; font-style: italic;'
      end
    end
    
    column :name do |category|
      div do
        strong category.name
        if category.featured
          span ' ⭐', style: 'color: #f39c12;'
        end
      end
    end
    
    column 'Description', :short_description do |category|
      truncate(category.short_description || category.description, length: 80)
    end
    
    column :status do |category|
      status_tag(category.status == 'active' ? 'Active' : 'Inactive', class: (category.status == 'active' ? 'ok' : 'error'))
    end
    
    column :kind do |category|
      status_tag(category.kind == 'main' ? 'Main' : 'Sub', class: (category.kind == 'main' ? 'ok' : 'warning'))
    end
    
    column 'Companies' do |category|
      span "#{category.companies.count}", style: 'font-weight: bold; color: #2196F3;'
    end
    
    column 'Products' do |category|
      span "#{category.products.count}", style: 'font-weight: bold; color: #4CAF50;'
    end
    
    column :created_at

    actions do |category|
      item 'View on Site', "/categories/#{category.seo_url}", target: '_blank', class: 'member_link'
    end
  end
end
