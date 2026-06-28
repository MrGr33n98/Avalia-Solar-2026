# frozen_string_literal: true

ActiveAdmin.register SeoLandingPage do
  menu label: 'Páginas SEO Locais', parent: 'Content'

  permit_params :slug, :category_id, :city_name, :state_abbr

  action_item :generate_capitals, only: :index do
    link_to 'Gerar capitais do Brasil', generate_capitals_admin_seo_landing_pages_path, method: :post
  end

  collection_action :generate_capitals, method: :post do
    pages = SeoLandingPage.ensure_brazil_capital_solar_pages!
    redirect_to collection_path, notice: "#{pages.size} páginas locais de capitais criadas ou atualizadas."
  end

  controller do
    def scoped_collection
      super.includes(:category)
    end
  end

  filter :slug
  filter :city_name
  filter :state_abbr
  filter :category
  filter :created_at

  index title: 'Páginas SEO Locais' do
    selectable_column
    id_column
    column :slug
    column('Cidade', &:city_name)
    column('UF', &:state_abbr)
    column('Categoria') { |page| page.category&.name }
    column('Rota pública', &:local_solar_path)
    column :updated_at
    actions
  end

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs 'Página local' do
      f.input :category, as: :select, collection: Category.active.order(:name).map { |category|
        [category.name, category.id]
      }
      f.input :state_abbr, label: 'UF', as: :select,
                           collection: Locations::BrLocations.states.map { |state|
                             ["#{state['name']} (#{state['acronym']})", state['acronym']]
                           },
                           include_blank: 'Selecione uma UF'
      f.input :city_name, label: 'Cidade'
      f.input :slug, hint: 'Opcional. Se ficar vazio, será gerado como energia-solar-uf-cidade.'
    end
    f.actions
  end

  show title: proc(&:slug) do
    attributes_table do
      row :id
      row :slug
      row('Cidade', &:city_name)
      row('UF', &:state_abbr)
      row('Categoria') { |page| page.category&.name }
      row('Rota pública', &:local_solar_path)
      row :metadata_cache
      row :created_at
      row :updated_at
    end
  end
end
