# frozen_string_literal: true

ActiveAdmin.register CompanyService do
  menu false
  permit_params :company_id, :category_id, :name, :slug, :description, :price_from, :status, coverage: [], images: []

  scope :all, default: true
  scope('Ativos') { |scope| scope.where(status: 'active') }
  scope('Inativos') { |scope| scope.where(status: 'inactive') }

  filter :company
  filter :category
  filter :name
  filter :slug
  filter :status, as: :select, collection: CompanyService.statuses
  filter :price_from
  filter :created_at

  member_action :approve, method: :put do
    resource.update!(status: 'active')
    redirect_to resource_path, notice: "Serviço '#{resource.name}' aprovado e ativado com sucesso!"
  end

  member_action :suspend, method: :put do
    resource.update!(status: 'inactive')
    redirect_to resource_path, alert: "Serviço '#{resource.name}' suspenso/inativado!"
  end

  action_item :approve, only: :show, if: -> { resource.inactive_status? } do
    link_to 'Aprovar / Ativar', approve_admin_company_service_path(resource), method: :put, class: 'button'
  end

  action_item :suspend, only: :show, if: -> { resource.active_status? } do
    link_to 'Suspender / Inativar', suspend_admin_company_service_path(resource), method: :put, class: 'button'
  end

  index do
    selectable_column
    id_column
    column('Serviço') do |service|
      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title') { link_to service.name, admin_company_service_path(service) }
        div(class: 'aa-entity-subtitle') { truncate(service.description.to_s, length: 80) }
      end
    end
    column('Empresa', :company, sortable: 'companies.name')
    column('Categoria', :category, sortable: 'categories.name')
    column('Preço a partir de') do |service|
      service.price_from.present? ? number_to_currency(service.price_from, unit: 'R$ ', separator: ',', delimiter: '.') : 'Sob consulta'
    end
    column('Status') do |service|
      status_tag(service.status.to_s.upcase, class: service.active_status? ? 'yes' : 'no')
    end
    column('Imagens') do |service|
      if service.images.attached?
        image_tag url_for(service.images.first), size: '32x32'
      else
        span '-', class: 'empty'
      end
    end
    actions do |service|
      if service.active_status?
        item 'Suspender', suspend_admin_company_service_path(service), method: :put, class: 'member_link'
      else
        item 'Aprovar', approve_admin_company_service_path(service), method: :put, class: 'member_link'
      end
    end
  end

  show do
    attributes_table do
      row :id
      row :company
      row :category
      row :name
      row :slug
      row :description
      row('Preço a partir de') do |service|
        service.price_from.present? ? number_to_currency(service.price_from, unit: 'R$ ', separator: ',', delimiter: '.') : 'Sob consulta'
      end
      row :coverage
      row('Status') do |service|
        status_tag(service.status.to_s.upcase, class: service.active_status? ? 'yes' : 'no')
      end
      row('Imagens') do |service|
        if service.images.attached?
          div style: 'display: flex; gap: 8px; flex-wrap: wrap;' do
            service.images.each do |img|
              image_tag url_for(img), size: '100x100', style: 'object-fit: cover; border-radius: 8px;'
            end
          end
        else
          para 'Nenhuma imagem cadastrada.'
        end
      end
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.inputs 'Dados do Serviço' do
      f.input :company
      f.input :category
      f.input :name
      f.input :slug
      f.input :description
      f.input :price_from
      f.input :status, as: :select, collection: CompanyService.statuses.keys
      f.input :images, as: :file, input_html: { multiple: true }
    end
    f.actions
  end
end
