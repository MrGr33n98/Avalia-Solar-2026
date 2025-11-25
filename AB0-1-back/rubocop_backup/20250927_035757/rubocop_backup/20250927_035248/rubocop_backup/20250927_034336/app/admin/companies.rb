# app/admin/companies.rb
ActiveAdmin.register Company do
  permit_params :name, :website, :phone, :address,
                :state, :city, :banner, :logo, :featured, :verified,
                :cnpj, :email, :whatsapp,
                :working_hours, :payment_methods,
                :certifications, :status, :founded_year, :employees_count,
                :awards, :partner_brands, :coverage_states, :coverage_cities,
                :latitude, :longitude, :minimum_ticket, :maximum_ticket,
                :financing_options, :response_time_sla, :languages,
                :email_public, :phone_alt, :facebook, :instagram,
                :linkedin, :description,
                category_ids: []

  form do |f|
    f.inputs 'Basic Information' do
      f.input :name
      f.input :description
      f.input :status, as: :select, collection: %w[active inactive pending blocked]
      f.input :featured
      f.input :verified
    end

    f.inputs 'Contact & Location' do
      f.input :email
      f.input :email_public
      f.input :phone
      f.input :phone_alt
      f.input :whatsapp
      f.input :address
      f.input :state
      f.input :city
      f.input :latitude
      f.input :longitude
    end

    f.inputs 'Business Details' do
      f.input :cnpj
      f.input :founded_year
      f.input :employees_count
      f.input :working_hours
      f.input :payment_methods
      f.input :minimum_ticket
      f.input :maximum_ticket
      f.input :financing_options
      f.input :response_time_sla
      f.input :languages
    end

    f.inputs 'Coverage & Certifications' do
      f.input :coverage_states
      f.input :coverage_cities
      f.input :certifications
      f.input :awards
      f.input :partner_brands
    end

    f.inputs 'Social Media' do
      f.input :website
      f.input :facebook
      f.input :instagram
      f.input :linkedin
    end

    f.inputs 'Media' do
      f.input :banner, as: :file
      f.input :logo, as: :file
    end

    f.inputs 'Categories' do
      f.input :categories, as: :check_boxes
    end

    f.actions
  end

  show do
    attributes_table do
      row :name
      row :cnpj
      row :email
      row :website
      row :phone
      row :whatsapp
      row :address
      row :state
      row :city
      row :working_hours
      row :payment_methods
      row :certifications
      row :featured
      row :verified
      row :status
      row :average_rating
      row :reviews_count
      row :categories do |company|
        company.categories.pluck(:name).join(', ')
      end
      row :banner do |company|
        if company.banner.attached?
          image_tag(url_for(company.banner), style: 'max-width: 300px')
        else
          content_tag(:span, 'Sem banner')
        end
      end
      row :logo do |company|
        if company.logo.attached?
          image_tag(url_for(company.logo), style: 'max-width: 200px')
        else
          content_tag(:span, 'Sem logo')
        end
      end
    end
  end

  filter :name
  filter :state
  filter :city
  filter :featured
  filter :verified
  filter :status
  filter :created_at
  filter :categories

  index do
    selectable_column
    id_column
    column :name
    column :state
    column :city
    column :featured
    column :verified
    column :status
    column :created_at
    actions
  end
end
