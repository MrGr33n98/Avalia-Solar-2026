ActiveAdmin.register User do
  permit_params do
    permitted = [:email, :password, :password_confirmation, :name, :role, :company_id]
    permitted << :approved_by_admin if User.column_names.include?('approved_by_admin')
    permitted
  end

  # Define explicit filters without Post references
  filter :email
  filter :name
  filter :created_at
  filter :updated_at

  # Remove any filter that might be causing the issue
  remove_filter :posts

  scope :all
  scope('Pendentes', if: proc { User.column_names.include?('approved_by_admin') }) { |scope| scope.where(approved_by_admin: false) }

  index do
    selectable_column
    id_column
    column :email
    column :name
    column 'Approved by Admin' do |user|
      user.approved_by_admin if user.respond_to?(:approved_by_admin)
    end
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :email
      f.input :name
      f.input :role, as: :select, collection: ['user', 'admin', 'company']
      f.input :company_id, as: :select, collection: -> { Company.pluck(:name, :id) }
      f.input :approved_by_admin if f.object.respond_to?(:approved_by_admin)
      f.input :password
      f.input :password_confirmation
    end
    f.actions
  end

  batch_action :aprovar, if: proc { User.column_names.include?('approved_by_admin') }, confirm: 'Aprovar usuários selecionados?' do |ids|
    batch_action_collection.where(id: ids).update_all(approved_by_admin: true)
    redirect_to collection_path, notice: 'Usuários aprovados.'
  end
end
