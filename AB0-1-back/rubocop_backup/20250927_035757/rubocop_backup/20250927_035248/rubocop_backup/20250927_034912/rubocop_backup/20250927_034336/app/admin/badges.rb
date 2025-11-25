ActiveAdmin.register Badge do
  permit_params :name, :description, :position, :year, :edition, :category_id, :image, :badge_image

  form do |f|
    f.inputs do
      f.input :name
      f.input :description
      f.input :position
      f.input :year
      f.input :edition
      f.input :category
      f.input :image
      f.input :badge_image, as: :file, hint: if f.object.badge_image.attached?
                                               image_tag(f.object.badge_image.variant(resize_to_limit: [100, 100]))
                                             else
                                               'Nenhuma imagem de selo anexada'
                                             end
    end
    f.actions
  end

  show do
    attributes_table do
      row :name
      row :description
      row :position
      row :year
      row :edition
      row :category
      row :image
      row :badge_image do |badge|
        image_tag badge.badge_image.variant(resize_to_limit: [200, 200]) if badge.badge_image.attached?
      end
      row :created_at
      row :updated_at
    end
  end
end
