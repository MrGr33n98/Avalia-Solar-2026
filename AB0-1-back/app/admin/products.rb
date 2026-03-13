ActiveAdmin.register Product do
  belongs_to :company, optional: true, finder: :find_by_slug_or_id

  # Your existing permit_params
  permit_params :name, :description, :price, :company_id, :seo_title, :meta_description, 
                category_ids: [], images: []

  # Explicitly define filters to avoid the error
  filter :name
  filter :description
  filter :price
  filter :company
  filter :seo_title
  filter :created_at
  # Remove the automatic categories filter that's causing the error
  remove_filter :categories

  index do
    selectable_column
    id_column
    column :name
    column :price
    column :company
    column "Imagens" do |product|
      if product.images.attached?
        product.images.each do |img|
          span do
            image_tag url_for(img), size: "50x50"
          end
        end
      else
        "Sem imagens"
      end
    end
    column :status
    actions
  end

  show do
    attributes_table do
      row :id
      row :name
      row :description
      row :price
      row :company
      row :status
      row "Imagens" do |product|
        if product.images.attached?
          div class: "product-images" do
            product.images.each do |img|
              div style: "display: inline-block; margin-right: 10px;" do
                image_tag url_for(img), size: "200x200"
              end
            end
          end
        end
      end
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.object.company_id ||= params[:company_id] if params[:company_id]
    f.inputs "Detalhes do Produto" do
      f.input :name
      f.input :description
      f.input :price
      f.input :company, collection: Company.all

      # Multiple image upload
      f.input :images, as: :file, input_html: { multiple: true }, label: "Fotos do Produto (Upload Múltiplo)"

      # Add categories select2
      f.input :categories, as: :select, multiple: true, input_html: { class: 'select2-input' },
                           collection: Category.all.order(:name)   
    end    f.inputs 'SEO & Metadados' do
      f.input :seo_title, 
              label: 'Título SEO (Meta Title)',
              hint: "Ideal: 30-60 caracteres. Atual: #{f.object.seo_title&.length || 0}. Se vazio, usará o nome do produto."
      f.input :meta_description, 
              label: 'Meta Descrição',
              as: :text,
              input_html: { rows: 3 },
              hint: "Ideal: 70-160 caracteres. Atual: #{f.object.meta_description&.length || 0}. Se vazio, usará a descrição."
    end
    f.actions
  end

  # Rest of your ActiveAdmin configuration...
end
