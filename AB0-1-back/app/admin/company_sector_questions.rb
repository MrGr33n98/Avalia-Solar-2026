ActiveAdmin.register CompanySectorQuestion do
  menu parent: 'Companies', label: 'Perguntas Setoriais', priority: 5

  permit_params :company_id, :prompt, :weight, :order, :enabled

  filter :company
  filter :enabled
  filter :created_at

  index do
    selectable_column
    id_column
    column :company
    column :prompt
    column :weight
    column :order
    column :enabled
    column :created_at
    actions
  end

  form do |f|
    f.semantic_errors *f.object.errors.attribute_names

    f.inputs 'Pergunta setorial' do
      f.input :company
      f.input :prompt
      f.input :weight
      f.input :order
      f.input :enabled
    end
    f.actions
  end
end
