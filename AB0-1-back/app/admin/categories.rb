# frozen_string_literal: true

require 'English'

ActiveAdmin.register Category, namespace: :admin do
  permit_params :name, :seo_url, :seo_title, :short_description, :description, :parent_id, :kind, :status, :featured,
                :banner, :icon, :permissions_config, company_ids: [], product_ids: [],
                category_lead_wizard_attributes: [:id, :enabled, :template_key, :template_version, :schema, :thank_you_config, :_destroy]

  after_save do |category|
    category.clear_query_cache! if category.respond_to?(:clear_query_cache!)
  end

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
      f.input :icon, as: :file, hint: f.object.icon.attached? ? image_tag(url_for(f.object.icon), size: '50x50') : 'No icon'
      f.input :banner, as: :file
    end

    f.inputs 'Associations' do
      companies = Company.order(:name).select(:id, :name, :city, :state).to_a
      selected_ids = Array(f.object.company_ids).map(&:to_i)
      selected_companies = companies.select { |company| selected_ids.include?(company.id) }

      f.template.concat(
        f.template.content_tag(:li, class: 'check_boxes input optional category-company-selector-field', id: 'category_companies_input') do
          label = f.template.content_tag(:label, 'Companies', class: 'label')

          controls = f.template.content_tag(:div, class: 'category-company-selector__controls') do
            search = f.template.search_field_tag(
              nil,
              nil,
              placeholder: 'Buscar empresa por nome...',
              class: 'category-company-selector__search',
              autocomplete: 'off',
              data: { role: 'search' }
            )

            counter = f.template.content_tag(
              :span,
              "#{selected_ids.size} selecionadas",
              class: 'category-company-selector__count',
              data: { role: 'count' }
            )

            toggle = f.template.label_tag(nil, class: 'category-company-selector__toggle') do
              f.template.check_box_tag(nil, '1', false, data: { role: 'selected-toggle' }) +
                f.template.content_tag(:span, 'Mostrar apenas selecionadas')
            end

            f.template.safe_join([search, counter, toggle])
          end

          selected_summary_items = if selected_companies.any?
                                     selected_companies.map do |company|
                                       f.template.content_tag(
                                         :span,
                                         company.name,
                                         class: 'category-company-selector__chip',
                                         data: { company_id: company.id }
                                       )
                                     end
                                   else
                                     [
                                       f.template.content_tag(
                                         :span,
                                         'Nenhuma empresa selecionada.',
                                         class: 'category-company-selector__empty-selected',
                                         data: { role: 'selected-empty' }
                                       ),
                                     ]
                                   end

          selected_summary = f.template.content_tag(:div, class: 'category-company-selector__selected') do
            title = f.template.content_tag(:div, 'Selecionadas', class: 'category-company-selector__selected-title')
            chips = f.template.content_tag(
              :div,
              f.template.safe_join(selected_summary_items),
              class: 'category-company-selector__chips',
              data: { role: 'selected-list' }
            )

            f.template.safe_join([title, chips])
          end

          company_items = companies.map do |company|
            location = [company.city, company.state].compact.reject(&:blank?).join(' - ')
            searchable_text = [company.name, company.city, company.state].compact.join(' ').downcase

            f.template.content_tag(
              :label,
              class: 'category-company-selector__item',
              data: {
                role: 'item',
                company_id: company.id,
                company_name: company.name,
                searchable_text: searchable_text,
              }
            ) do
              checkbox = f.template.check_box_tag(
                'category[company_ids][]',
                company.id,
                selected_ids.include?(company.id),
                id: "category_company_ids_#{company.id}",
                data: { role: 'checkbox', company_name: company.name }
              )

              text = f.template.content_tag(:div, class: 'category-company-selector__item-text') do
                name = f.template.content_tag(:span, company.name, class: 'category-company-selector__item-name')
                meta = if location.present?
                         f.template.content_tag(:span, location, class: 'category-company-selector__item-meta')
                       else
                         ''.html_safe
                       end
                f.template.safe_join([name, meta])
              end

              f.template.safe_join([checkbox, text])
            end
          end

          list = f.template.content_tag(:div, class: 'category-company-selector__list-wrapper') do
            hidden = f.template.hidden_field_tag('category[company_ids][]', '', id: nil)
            empty = f.template.content_tag(
              :div,
              'Nenhuma empresa encontrada para o filtro atual.',
              class: 'category-company-selector__empty-results',
              data: { role: 'empty-results' }
            )
            items = f.template.content_tag(
              :div,
              f.template.safe_join(company_items),
              class: 'category-company-selector__list',
              data: { role: 'list' }
            )

            f.template.safe_join([hidden, empty, items])
          end

          body = f.template.content_tag(
            :div,
            f.template.safe_join([controls, selected_summary, list]),
            class: 'category-company-selector',
            data: { behavior: 'category-company-selector' }
          )

          f.template.safe_join([label, body])
        end
      )
    end

    f.inputs 'Lead Wizard Settings' do
      f.has_many :category_lead_wizard, allow_destroy: true, heading: false, new_record: 'Configure Wizard' do |w|
        w.input :enabled
        w.input :template_key, as: :select, collection: %w[solar ev_charger financing generic]
        w.input :template_version
        w.input :schema, as: :text, 
                input_html: { 
                  rows: 10, 
                  value: w.object.schema.present? ? JSON.pretty_generate(w.object.schema) : '{}' 
                },
                hint: 'JSON schema defining steps and fields.'
        w.input :thank_you_config, as: :text,
                input_html: { 
                  rows: 5, 
                  value: w.object.thank_you_config.present? ? JSON.pretty_generate(w.object.thank_you_config) : '{}' 
                }
      end
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

    panel 'Lead Wizard Configuration' do
      if category.category_lead_wizard
        attributes_table_for category.category_lead_wizard do
          row :enabled
          row :template_key
          row :template_version
          row :schema do |w|
            pre JSON.pretty_generate(w.schema) if w.schema.present?
          end
          row :thank_you_config do |w|
            pre JSON.pretty_generate(w.thank_you_config) if w.thank_you_config.present?
          end
        end
      else
        span 'No wizard configured for this category. Falling back to default.'
      end
    end
  end
end
