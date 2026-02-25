ActiveAdmin.register Faq do
  permit_params :question, :answer, :category, :position, :active

  menu label: 'FAQs', priority: 45

  scope :all
  scope :active

  filter :category
  filter :active
  filter :question

  index do
    selectable_column
    id_column
    column :question
    column :category
    column :position
    column :active
    column('Helpful +', &:helpful_yes)
    column('Helpful -', &:helpful_no)
    actions
  end

  form do |f|
    f.inputs 'FAQ' do
      f.input :question
      f.input :answer, as: :text
      f.input :category
      f.input :position
      f.input :active
    end
    f.actions
  end
end
