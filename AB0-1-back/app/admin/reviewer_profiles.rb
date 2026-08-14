ActiveAdmin.register ReviewerProfile do
  menu label: 'Perfis de reviewers', parent: 'Reviews', priority: 3
  permit_params :user_id, :profession, :company_name, :bio, :birth_date, :linkedin_url, :instagram_url, :website_url, :youtube_url, :public_profile, :public_slug, :creator_enabled, :public_headline, :public_bio, :public_email_enabled, :lead_capture_enabled

  controller do
    def scoped_collection
      super.includes(:user)
    end
  end

  filter :user
  filter :profession
  filter :public_profile
  filter :created_at

  index do
    selectable_column
    id_column
    column :user
    column :profession
    column :company_name
    column :public_profile
    column :updated_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :user
      f.input :profession
      f.input :company_name
      f.input :bio
      f.input :birth_date
      f.input :linkedin_url
      f.input :instagram_url
      f.input :website_url
      f.input :public_profile
      f.input :creator_enabled
      f.input :public_slug
      f.input :public_headline
      f.input :public_bio
      f.input :lead_capture_enabled
      f.input :public_email_enabled
      f.input :youtube_url
    end
    f.actions
  end
end
