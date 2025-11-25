ActiveAdmin.register CampaignReview do
  permit_params :product_id, :company_id, :title, :code, :member_id, :share_code, :goal, :achieved, :debutants, :shares, :prize, :start_at, :end_at, :sponsored

  filter :title
  filter :company
  filter :product
  filter :sponsored
  filter :start_at
  filter :end_at
  filter :created_at

  index do
    selectable_column
    id_column
    column :title
    column :company
    column :product
    column :sponsored
    column :goal
    column :achieved
    column :start_at
    column :end_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :title
      f.input :company
      f.input :product
      f.input :code
      f.input :member_id
      f.input :share_code
      f.input :goal
      f.input :achieved
      f.input :debutants
      f.input :shares
      f.input :prize
      f.input :start_at
      f.input :end_at
      f.input :sponsored
    end
    f.actions
  end
end
