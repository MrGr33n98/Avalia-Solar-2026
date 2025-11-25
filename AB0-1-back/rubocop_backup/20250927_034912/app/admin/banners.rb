ActiveAdmin.register Banner do
  permit_params :title, :image, :category_id, :link, :active, :sponsored, :banner_type, :position

  index do
    selectable_column
    id_column
    column :title
    column :image do |banner|
      image_tag url_for(banner.image), style: 'max-height: 100px' if banner.image.attached?
    end
    column :banner_type
    column :position
    column :active
    column :sponsored
    column :category
    column :link
    column :created_at
    actions
  end

  form do |f|
    f.inputs 'Detalhes do Banner' do
      f.input :title
      f.input :image, as: :file,
                      hint: f.object.image.attached? ? image_tag(url_for(f.object.image), style: 'max-height: 100px') : 'Arraste e solte a imagem aqui ou clique para selecionar',
                      input_html: {
                        direct_upload: true,
                        accept: 'image/*'
                      }
      f.input :banner_type, as: :select, collection: [
        ['Retangular Grande', 'rectangular_large'],
        ['Retangular Pequeno', 'rectangular_small']
      ]
      f.input :position, as: :select, collection: [
        %w[Navbar navbar],
        %w[Sidebar sidebar]
      ]
      f.input :category
      f.input :link
      f.input :active
      f.input :sponsored
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :title
      row :image do |banner|
        image_tag url_for(banner.image), style: 'max-height: 300px' if banner.image.attached?
      end
      row :banner_type
      row :position
      row :category
      row :link
      row :active
      row :sponsored
      row :created_at
      row :updated_at
    end
  end
  # Defina filtros apenas para atributos simples
  filter :title
  filter :banner_type
  filter :position
  filter :category
  filter :link
  filter :active
  filter :sponsored
  filter :created_at
end
