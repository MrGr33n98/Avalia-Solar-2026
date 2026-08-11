# frozen_string_literal: true

# Visão operacional agregada de Product. Não substitui resource nem cria model novo.
ActiveAdmin.register_page 'Produto 360' do
  menu false

  content title: 'Produto 360' do
    product = Product.includes(:categories, company_products: :company).find_by(id: params[:product_id])

    if product.nil?
      panel 'Selecionar produto' do
        para 'Informe um produto para abrir visão 360.'
        link_to 'Abrir Produtos', admin_products_path, class: 'button'
      end
    else
      div style: 'display:flex;gap:16px;align-items:center;margin-bottom:20px;' do
        if product.images.attached?
          image_tag url_for(product.images.first), size: '96x96', style: 'object-fit:cover;border-radius:8px;'
        end
        div do
          h2 product.name
          para "SKU: #{product.sku || '—'}"
          status_tag product.status
        end
      end

      columns do
        column { panel('Preço de referência') { h2 number_to_currency(product.price || 0, unit: 'R$ ', separator: ',', delimiter: '.') } }
        column { panel('Empresas vinculadas') { h2 product.company_products.count } }
        column { panel('Ofertas') { h2 product.product_offers.count } }
        column { panel('Avaliações') { h2 product.reviews.count } }
      end

      panel 'Resumo' do
        para "Categorias: #{product.categories.map(&:name).join(', ').presence || 'Nenhuma categoria associada.'}"
        para "Última atualização: #{product.updated_at&.strftime('%d/%m/%Y %H:%M')}"
      end

      panel 'Empresas vinculadas' do
        relationships = product.company_products.includes(:company).limit(50)
        if relationships.any?
          table_for relationships do
            column('Empresa') { |relationship| link_to relationship.company.name, admin_company_path(relationship.company) }
            column('Papel comercial') { |relationship| relationship.relationship_type }
            column('Autorização') { |relationship| relationship.authorized? ? 'Autorizada' : 'Não autorizada' }
            column('Território') { |relationship| Array(relationship.territories).join(', ').presence || '—' }
            column('Status') { |relationship| status_tag relationship.status }
          end
        else
          para 'Nenhuma empresa vinculada.'
        end
      end

      panel 'Ofertas' do
        offers = product.product_offers.includes(company_product: :company).limit(50)
        if offers.any?
          table_for offers do
            column('Empresa') { |offer| offer.company_product.company.name }
            column('Preço da oferta') { |offer| number_to_currency(offer.price || 0, unit: 'R$ ', separator: ',', delimiter: '.') }
            column :stock
            column('Prazo') { |offer| offer.lead_time_days ? "#{offer.lead_time_days} dias" : '—' }
            column('Instalação') { |offer| offer.installation_available? ? 'Sim' : 'Não' }
            column('Status') { |offer| status_tag offer.status }
          end
        else
          para 'Nenhuma oferta cadastrada para este produto.'
        end
      end

      panel 'Histórico do preço de referência' do
        histories = product.product_price_histories.order(recorded_at: :desc).limit(20)
        if histories.any?
          table_for histories do
            column('Preço') { |history| number_to_currency(history.price, unit: 'R$ ', separator: ',', delimiter: '.') }
            column('Registrado em') { |history| history.recorded_at&.strftime('%d/%m/%Y %H:%M') }
            column('Origem') { |history| history.metadata&.fetch('source', nil) || '—' }
          end
        else
          para 'Nenhum histórico do preço de referência.'
        end
      end

      div style: 'margin-top:20px;' do
        link_to 'Editar produto', edit_admin_product_path(product), class: 'button'
        link_to 'Abrir resource completo', admin_product_path(product), class: 'button'
      end
    end
  end
end
