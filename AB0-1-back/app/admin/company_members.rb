ActiveAdmin.register CompanyMember do
  menu parent: 'Corporativo', label: 'Membros'

  actions :all, except: [:destroy]

  permit_params :company_id, :user_id, :role

  index do
    selectable_column
    id_column
    column :company
    column :user
    column :role
    column :created_at
    actions
  end

  filter :company
  filter :user
  filter :role, as: :select, collection: -> { CompanyMember.roles.keys }
  filter :created_at

  show do
    attributes_table do
      row :company
      row :user
      row :role
      row :created_at
      row :updated_at
    end
    
    panel "Histórico de Alterações" do
      table_for resource.versions.order(created_at: :desc) do
        column :event
        column :whodunnit
        column :created_at
        column :changes do |version|
          version.changeset.map { |k, v| "#{k}: #{v[0]} -> #{v[1]}" }.join(", ")
        end
      end
    end
  end

  form do |f|
    f.inputs do
      f.input :company
      f.input :user
      f.input :role, as: :select, collection: CompanyMember.roles.keys
    end
    f.actions
  end
end
