ActiveAdmin.register BannerGlobal do
  permit_params :title, :image, :link

  index do
    selectable_column
    id_column
    column :title
    column :image do |banner_global|
      image_tag url_for(banner_global.image), style: 'max-height: 100px' if banner_global.image.attached?
    end
    column :link
    column :created_at
    actions
  end

  form do |f|
    f.inputs 'Detalhes do Banner Global' do
      f.input :title
      f.input :image, as: :file,
                      hint: f.object.image.attached? ? image_tag(url_for(f.object.image), style: 'max-height: 100px') : 'Arraste e solte a imagem aqui ou clique para selecionar',
                      input_html: { direct_upload: true, accept: 'image/*' }
      f.input :link
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :title
      row :image do |banner_global|
        image_tag url_for(banner_global.image), style: 'max-height: 300px' if banner_global.image.attached?
      end
      row :link
      row :created_at
    end
  end
end
