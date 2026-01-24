ActiveAdmin.register CompanyFinancingPartner do
  permit_params :company_id, :name, :partner_type, :website, :priority, :position, :active, :badge, :logo

  includes :company

  index do
    selectable_column
    id_column
    column :company
    column :name
    column :partner_type
    column :badge
    column :priority
    column :active
    actions
  end

  filter :company
  filter :partner_type
  filter :active

  form do |f|
    f.inputs do
      f.input :company
      f.input :name
      f.input :partner_type
      f.input :website
      f.input :badge
      f.input :priority
      f.input :position
      f.input :active
      f.input :logo, as: :file, hint: (f.object.logo.attached? ? image_tag(url_for(f.object.logo), style: 'max-width: 120px;') : nil)
    end
    f.actions
  end
end
