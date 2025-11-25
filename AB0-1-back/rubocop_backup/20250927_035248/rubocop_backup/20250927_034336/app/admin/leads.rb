ActiveAdmin.register Lead do
  # Update the permitted parameters
  permit_params :name, :email, :phone, :company, :message

  # Explicitly define filters
  filter :name
  filter :email
  filter :phone
  filter :company
  filter :created_at
  filter :updated_at

  # Add CSV import functionality
  action_item :import_csv, only: :index do
    link_to 'Import Leads CSV', action: 'upload_csv'
  end

  collection_action :upload_csv do
    render 'admin/csv/upload_leads_csv'
  end

  collection_action :import_csv, method: :post do
    if params[:csv_file].present?
      begin
        CSV.foreach(params[:csv_file].path, headers: true) do |row|
          Lead.create!(
            name: row['name'],
            email: row['email'],
            phone: row['phone'],
            company: row['company'],
            message: row['message']
          )
        end
        redirect_to collection_path, notice: 'Leads imported successfully!'
      rescue StandardError => e
        redirect_to collection_path, alert: "Error importing: #{e.message}"
      end
    else
      redirect_to collection_path, alert: 'No CSV file selected'
    end
  end

  index do
    selectable_column
    id_column
    column :name
    column :email
    column :phone
    column :company
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :email
      f.input :phone
      f.input :company
      f.input :message # Replace status with message
    end
    f.actions
  end
end
