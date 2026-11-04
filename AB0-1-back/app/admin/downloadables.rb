ActiveAdmin.register Downloadable do
  menu false

  permit_params :title, :description, :file_url, :article_id

  filter :title
  filter :article_id
  filter :created_at

  index do
    selectable_column
    id_column
    column :title
    column :article_id
    column :file_url
    column :download_count
    column :created_at
    actions
  end

  form do |f|
    f.inputs 'Arquivo para download' do
      f.input :title
      f.input :description
      f.input :file_url
      f.input :article_id
    end
    f.actions
  end
end
