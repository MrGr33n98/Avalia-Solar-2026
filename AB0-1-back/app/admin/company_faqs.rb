ActiveAdmin.register CompanyFaq do
  permit_params :company_id, :question, :answer, :status, :position

  includes :company

  index do
    selectable_column
    id_column
    column :company
    column :question
    column :status
    column :position
    actions
  end

  filter :company
  filter :status

  form do |f|
    f.inputs do
      f.input :company
      f.input :question
      f.input :answer
      f.input :status, as: :select, collection: CompanyFaq.statuses.keys
      f.input :position
    end
    f.actions
  end
end
