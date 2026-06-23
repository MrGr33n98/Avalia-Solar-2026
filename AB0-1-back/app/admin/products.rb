ActiveAdmin.register Product do
  belongs_to :company, optional: true, finder: :find_by_slug_or_id

  permit_params do
    base = [
      :name, :description, :short_description, :price, :sku, :stock, :status, :featured,
      :company_id, :seo_title, :seo_description,
      { category_ids: [] },
      { images: [] }
    ]

    # Backward-compatible: only permit persisted image_url column if it exists.
    base << :image_url if Product.column_names.include?('image_url')
    base
  end

  # Explicitly define filters to avoid the error
  filter :name
  filter :sku
  filter :description
  filter :price
  filter :stock
  filter :status, as: :select, collection: Product.statuses
  filter :featured, as: :boolean
  filter :company
  filter :seo_title
  filter :created_at
  # Remove the automatic categories filter that's causing the error
  remove_filter :categories

  index do
    selectable_column
    id_column
    column('Produto') do |product|
      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title') { product.name } +
          div(class: 'aa-entity-subtitle') { product.short_description.presence || truncate(product.description.to_s, length: 80) }
      end
    end
    column('SKU') do |product|
      span product.sku.presence || '-', class: 'aa-code-pill'
    end
    column('Preço') do |product|
      div class: 'aa-metric-stack' do
        div(class: 'aa-metric-value') { number_to_currency(product.price || 0, unit: 'R$ ', separator: ',', delimiter: '.') } +
          div(class: 'aa-metric-caption') { "estoque #{product.stock || 0}" }
      end
    end
    column('Status') do |product|
      status_tag(product.status.to_s.upcase, class: 'aa-status-pill')
    end
    column('Empresa') do |product|
      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title aa-entity-title--sm') { product.company&.name || '-' } +
          div(class: 'aa-entity-subtitle') { product.categories.first(2).map(&:name).join(', ').presence || 'Sem categoria' }
      end
    end
    column "Imagens" do |product|
      if product.images.attached?
        count = product.images.size
        max = product.max_images_allowed
        state_class = count >= max ? 'is-critical' : 'is-healthy'

        div class: 'aa-image-stack' do
          span "#{count}/#{max}", class: "aa-image-stack__count #{state_class}"
          br
          product.images.first(3).each do |img|
            span class: 'aa-image-stack__thumb' do
              image_tag url_for(img), size: "32x32"
            end
          end
          span "...", class: 'aa-image-stack__overflow' if count > 3
        end
      else
        span "0/#{product.max_images_allowed}", class: 'aa-image-stack__count is-empty'
      end
    end
    column :featured do |product|
      status_tag(product.featured? ? "Sim" : "Não", class: "aa-status-pill #{product.featured? ? 'yes' : 'no'}")
    end
    actions
  end

  show do
    attributes_table do
      row :id
      row :name
      row :description
      row :short_description
      row :sku
      row :price
      row :stock
      row :status
      row :featured
      row :company
      row "Plano da Empresa" do |product|
        if product.company&.plan
          plan_tier = product.company.plan.inferred_plan_tier
          "#{plan_tier.capitalize} (limite: #{product.max_images_allowed} imagens por produto)"
        else
          "Sem plano definido (limite: #{product.max_images_allowed} imagens)"
        end
      end
      row "Status do Upload de Imagens" do |product|
        if product.can_upload_images?
          status_tag "Upload Permitido", class: "yes"
        else
          status_tag "Upload Restrito", class: "no"
        end
      end
      row "Imagens" do |product|
        if product.can_upload_images?
          if product.images.attached?
            div class: "product-images" do
              para "#{product.images.count}/#{product.max_images_allowed} imagens utilizadas"
              para "Slots restantes: #{product.remaining_image_slots}" if product.remaining_image_slots > 0
              para product.plan_upgrade_message_for_images, style: "color: orange; font-weight: bold;" if product.plan_upgrade_message_for_images && !product.can_upload_more_images?
              
              product.images.each do |img|
                div style: "display: inline-block; margin-right: 10px; margin-bottom: 10px;" do
                  div do
                    image_tag url_for(img), size: "200x200", style: "border: 1px solid #ddd; border-radius: 4px;"
                  end
                  div style: "font-size: 12px; color: #666; text-align: center; margin-top: 5px;" do
                    "#{number_to_human_size(img.blob.byte_size)} - #{img.blob.content_type}"
                  end
                end
              end
            end
          else
            para "Nenhuma imagem anexada"
            para "Pode adicionar até #{product.max_images_allowed} imagens neste plano"
          end
        else
          div class: "alert alert-warning" do
            product.upload_restriction_message
          end
        end
      end
      row(:image_url) if Product.column_names.include?('image_url')
      row :seo_title
      row :seo_description
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.object.company_id ||= params[:company_id] if params[:company_id]
    f.inputs "Detalhes do Produto" do
      f.input :name
      f.input :description
      f.input :short_description
      f.input :price
      f.input :sku, label: "SKU (Código do Produto)", hint: "Campo obrigatório - código único do produto"
      f.input :stock, label: "Estoque"
      f.input :status, as: :select, collection: Product.statuses.keys, include_blank: false
      f.input :featured, as: :boolean, label: "Produto em Destaque"
      f.input :company, collection: Company.all

      # Multiple image upload with plan-based limits
      if f.object.persisted? && f.object.company
        if f.object.can_upload_images?
          max_images = f.object.max_images_allowed
          current_count = f.object.images.count
          remaining = f.object.remaining_image_slots
          plan_tier = f.object.company&.plan&.inferred_plan_tier || 'free'
          
          hint_message = "Plano #{plan_tier.capitalize}: máximo #{max_images} imagens por produto. "
          hint_message += "Você já tem #{current_count} imagens" if current_count > 0
          hint_message += " e pode adicionar mais #{remaining}" if remaining > 0
          hint_message += ". #{f.object.plan_upgrade_message_for_images}" if f.object.plan_upgrade_message_for_images && remaining == 0
        else
          hint_message = f.object.upload_restriction_message
        end
      else
        hint_message = "Você pode fazer upload de múltiplas imagens (limite baseado no plano da empresa)"
      end
      
      # Only show upload field if user can upload images
      if !f.object.persisted? || !f.object.company || f.object.can_upload_images?
        f.input :images, 
                as: :file, 
                input_html: { multiple: true }, 
                label: "Fotos do Produto (Upload Múltiplo)",
                hint: hint_message
      else
        div class: "form-group" do
          label "Upload de Imagens", class: "label"
          div class: "alert alert-warning" do
            hint_message
          end
        end
      end
      
      # Optional single image URL (only if persisted column exists)
      if Product.column_names.include?('image_url')
        f.input :image_url, label: "URL da Imagem (Opcional)", hint: "URL externa da imagem, caso não use upload"
      end

      # Add categories as hierarchical checkboxes
      build_category_hierarchy = ->(parent_id = nil, depth = 0, memo = []) {
        Category.where(parent_id: parent_id).order(:name).each do |cat|
          memo << [cat, depth]
          build_category_hierarchy.call(cat.id, depth + 1, memo)
        end
        memo
      }
      categories_with_depth = build_category_hierarchy.call(nil)
      categories_collection = categories_with_depth.map { |cat, d| ["#{'— ' * d} #{cat.name}", cat.id] }

      f.input :categories, as: :check_boxes, collection: categories_collection
    end
    f.inputs 'SEO & Metadados' do
      f.input :seo_title, 
              label: 'Título SEO (Meta Title)',
              hint: "Ideal: 30-60 caracteres. Atual: #{f.object.seo_title&.length || 0}. Se vazio, usará o nome do produto."
      f.input :seo_description, 
              label: 'Descrição SEO',
              as: :text,
              input_html: { rows: 3 },
              hint: "Ideal: 70-160 caracteres. Atual: #{f.object.seo_description&.length || 0}."
      # meta_description não existe como coluna em products (usar seo_description acima)
    end
    f.actions
  end

  # Rest of your ActiveAdmin configuration...
  controller do
    def scoped_collection
      super.includes(:company, :categories, images_attachments: :blob)
    end
  end
end
