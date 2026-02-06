ActiveAdmin.register AdminUser do
  permit_params :email, :password, :password_confirmation, :avatar_photo, :name, :bio

  index do
    selectable_column
    id_column
    column :avatar do |admin|
      if admin.avatar_photo.attached?
        begin
          image_tag url_for(admin.avatar_photo), style: 'border-radius:50%;max-height:50px;max-width:50px;object-fit:cover;'
        rescue
          status_tag 'sem avatar', class: 'warning'
        end
      end
    end
    column :name
    column :email
    column :otp_enabled? do |admin|
      status_tag (admin.otp_required_for_login ? "Habilitado" : "Desabilitado"), (admin.otp_required_for_login ? :ok : :warning)
    end
    column :current_sign_in_at
    column :created_at
    actions
  end

  filter :email
  filter :name
  filter :current_sign_in_at
  filter :created_at

  form html: { multipart: true } do |f|
    f.inputs 'Detalhes do Usuário' do
      f.input :name
      f.input :email
      f.input :bio
      f.input :avatar_photo, as: :file, 
              input_html: { accept: 'image/jpeg,image/png,image/webp' }, 
              hint: f.object.avatar_photo.attached? ? image_tag(url_for(f.object.avatar_photo), style: 'border-radius:50%;max-height:100px;max-width:100px;object-fit:cover;') : 'Upload JPG/PNG/WebP até 2MB'
    end
    f.inputs 'Segurança' do
      f.input :password
      f.input :password_confirmation
    end
    f.actions
  end
end
