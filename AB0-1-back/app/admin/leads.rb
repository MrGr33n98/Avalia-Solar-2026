ActiveAdmin.register Lead do
  menu label: 'Leads'
  # Update the permitted parameters
  permit_params :name, :email, :phone, :company, :message, :project_type, :estimated_budget,
                :location, :company_id, :product_vertical, :project_profile, :quote_type,
                :system_size_band, :bill_value, :monthly_kwh, :decision_timeline, :address_full,
                :city, :state, :zipcode, :consent_at, :consent_ip, :otp_sent_at, :otp_verified_at,
                :otp_attempts, :wizard_status

  # Explicitly define filters
  filter :name
  filter :email
  filter :phone
  filter :company
  filter :company_id
  filter :project_type
  filter :estimated_budget
  filter :location
  filter :product_vertical
  filter :project_profile
  filter :quote_type
  filter :system_size_band
  filter :decision_timeline
  filter :state
  filter :city
  filter :wizard_status
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
    column :company_id
    column :project_type
    column :estimated_budget
    column :location
    column :state
    column :city
    column :wizard_status
    column :created_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :email
      f.input :phone
      f.input :company
      f.input :company_id
      f.input :project_type
      f.input :estimated_budget
      f.input :location
      f.input :message
    end
    f.inputs 'Wizard' do
      f.input :product_vertical
      f.input :project_profile
      f.input :quote_type
      f.input :system_size_band
      f.input :bill_value
      f.input :monthly_kwh
      f.input :decision_timeline
      f.input :address_full
      f.input :state
      f.input :city
      f.input :zipcode
      f.input :wizard_status
      f.input :consent_at
      f.input :consent_ip
      f.input :otp_sent_at
      f.input :otp_verified_at
      f.input :otp_attempts
    end
    f.actions
  end
end
