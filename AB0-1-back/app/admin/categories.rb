# frozen_string_literal: true

require 'English'

ActiveAdmin.register Category, namespace: :admin do
  permit_params :name, :seo_url, :seo_title, :short_description, :description, :parent_id, :kind, :status, :featured,
                :banner, :icon, :home_carousel_banner, :permissions_config, :seo_keywords, :seo_description, company_ids: [], product_ids: []

  after_save do |category|
    category.clear_query_cache! if category.respond_to?(:clear_query_cache!)
  end

  action_item :import_csv, only: :index do
    link_to 'Import CSV', upload_csv_admin_categories_path, class: 'button'
  end

  action_item :lead_wizard_versions, only: :show do
    link_to 'Lead Wizard Versions',
            admin_lead_wizard_versions_path(q: { category_id_eq: resource.id }),
            class: 'button'
  end

  collection_action :upload_csv, method: :get do
    render 'admin/csv/upload_csv'
  end

  collection_action :import_csv, method: :post do
    if params[:csv_file].nil?
      redirect_to upload_csv_admin_categories_path, alert: 'No file selected'
      return
    end
    # CSV import logic...
  end

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

  form html: { multipart: true } do |f|
    f.semantic_errors

    f.inputs 'Basic Information' do
      f.input :name
      f.input :short_description,
              label: 'Meta Description / Short Description',
              hint: "Ideal: 70-160 caracteres. Atual: #{f.object.short_description&.length || 0}. Usado para SEO e previews."
      f.input :description, as: :text, input_html: { rows: 10 }
      f.input :seo_url, hint: 'URL-friendly slug (deixe em branco para gerar automaticamente)'
      f.input :seo_title,
              label: 'SEO Title',
              hint: "Ideal: 30-60 caracteres. Atual: #{f.object.seo_title&.length || 0}. Título para motores de busca."
      f.input :seo_description,
              label: 'SEO Description',
              as: :text,
              input_html: { rows: 3 },
              hint: "Ideal: 70-160 caracteres. Atual: #{f.object.seo_description&.length || 0}. Se vazio, usará a descrição curta."
      f.input :seo_keywords,
              label: 'SEO Keywords',
              hint: "Palavras-chave separadas por vírgula."
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
      f.input :banner, as: :file,
                       hint: f.object.banner.attached? ? image_tag(url_for(f.object.banner), size: '200x100') : 'No banner'
      f.input :home_carousel_banner,
              as: :file,
              hint: if f.object.home_carousel_banner.attached?
                      image_tag(url_for(f.object.home_carousel_banner),
                                size: '200x100')
                    else
                      'Imagem usada no carrossel de categorias da home. Recomendada proporção horizontal/card.'
                    end
    end

    f.inputs 'Associations' do
      f.input :companies,
              as: :select,
              multiple: true,
              collection: Company.order(:name).map { |company|
                location = [company.city, company.state].compact.reject(&:blank?).join(' - ')
                ["#{company.name}#{" (#{location})" if location.present?}", company.id]
              },
              input_html: { class: 'select2-input', style: 'width: 100%' },
              hint: 'Busque e selecione uma ou mais empresas relacionadas a esta categoria.'
    end

    f.inputs 'Permission Settings' do
      f.input :permissions_config, as: :text, input_html: { rows: 5 }
    end

    f.actions
  end

  index do
    selectable_column
    id_column
    column :name
    column :status
    column :featured
    actions
  end

  show do
    attributes_table do
      row :name
      row :status
      row :kind
      row :created_at
    end

    panel 'Lead Wizard' do
      current_version = category.latest_published_lead_wizard_version
      legacy_wizard = CategoryLeadWizard.find_by(category_id: category.id, enabled: true)

      if current_version.present?
        attributes_table_for current_version do
          row :scope_label
          row :status do |version|
            status_tag(version.status)
          end
          row :template_key
          row :template_version
          row :version_number
          row :updated_at
          row('Open') { |version| link_to 'View version', admin_lead_wizard_version_path(version) }
        end
      elsif legacy_wizard.present?
        para 'Legacy JSON wizard detected. Create a Lead Wizard Version to move this category to the normalized engine.'
      else
        para 'No wizard configured for this category. It will fall back to the global default.'
      end
    end

    panel 'Lead Wizard Versions' do
      versions = category.lead_wizard_versions.latest_first

      if versions.any?
        table_for versions do
          column :version_number
          column :template_key
          column :template_version
          column :status do |version|
            status_tag(version.status)
          end
          column :scope_label
          column :updated_at
          column('Ações') do |version|
            link_to 'Ver', admin_lead_wizard_version_path(version)
          end
        end
      else
        para 'Nenhuma versão criada ainda.'
      end
    end
  end
end
