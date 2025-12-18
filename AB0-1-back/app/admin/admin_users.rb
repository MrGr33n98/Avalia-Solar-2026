ActiveAdmin.register AdminUser do
  permit_params :email, :password, :password_confirmation, :avatar_photo

  index do
    selectable_column
    id_column
    column :email
    column :avatar do |admin|
      if admin.avatar_photo.attached?
        image_tag admin.avatar_photo.variant(resize_to_fill: [50, 50]), style: 'border-radius:50%;'
      end
    end
    column :current_sign_in_at
    column :sign_in_count
    column :created_at
    actions
  end

  filter :email
  filter :current_sign_in_at
  filter :sign_in_count
  filter :created_at

  form do |f|
    f.inputs do
      f.input :email
      f.input :avatar_photo, as: :file, input_html: { accept: 'image/jpeg,image/png,image/webp' }, hint: (f.object.avatar_photo.attached? ? image_tag(f.object.avatar_photo.variant(resize_to_fill: [75, 75]), style: 'border-radius:50%;') : 'Upload JPG/PNG/WebP até 2MB')
      f.input :password
      f.input :password_confirmation
    end
    f.actions
  end
end
