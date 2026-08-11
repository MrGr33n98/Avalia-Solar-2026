# frozen_string_literal: true

# Central administrativa do domínio Catálogo & Produtos.
# Resources continuam separados; esta página organiza acesso e operação.
ActiveAdmin.register_page 'Catálogo & Produtos' do
  menu priority: 4

  content title: 'Catálogo & Produtos' do
    tabs = [
      ['Visão Geral', admin_catalogo_produtos_path],
      ['Produtos', admin_products_path],
      ['Categorias', admin_categories_path],
      ['Empresas & Produtos', admin_company_products_path],
      ['Ofertas', admin_product_offers_path]
    ]

    div class: 'catalog-products-hub-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    columns do
      metric = lambda do |title, value, detail|
        panel title do
          h2 number_with_delimiter(value, delimiter: '.')
          span detail
        end
      end

      column { metric.call('Produtos totais', Product.count, 'Itens no catálogo') }
      column { metric.call('Produtos ativos', Product.active_status.count, 'Publicados') }
      column { metric.call('Rascunhos', Product.draft_status.count, 'Aguardando publicação') }
      column { metric.call('Arquivados', Product.archived_status.count, 'Fora do catálogo ativo') }
    end

    columns do
      column { metric.call('Vínculos ativos', CompanyProduct.active_status.count, 'Empresa-produto') }
      column { metric.call('Ofertas ativas', ProductOffer.active_status.count, 'Ofertas disponíveis') }
    end

    columns do
      column do
        panel 'Produtos cadastrados recentemente' do
          products = Product.order(created_at: :desc).limit(10)
          if products.any?
            table_for products do
              column('Produto') { |product| link_to product.name, admin_product_path(product) }
              column :sku
              column('Preço de referência') { |product| number_to_currency(product.price || 0, unit: 'R$ ', separator: ',', delimiter: '.') }
              column('Status') { |product| status_tag product.status }
            end
          else
            para 'Nenhum produto cadastrado.'
          end
        end
      end
      column do
        panel 'Ofertas recentes' do
          offers = ProductOffer.includes(company_product: %i[company product]).order(created_at: :desc).limit(10)
          if offers.any?
            table_for offers do
              column('Empresa') { |offer| offer.company_product&.company&.name || 'Empresa não vinculada' }
              column('Produto') { |offer| offer.company_product&.product&.name || 'Produto não vinculado' }
              column('Preço da oferta') { |offer| number_to_currency(offer.price || 0, unit: 'R$ ', separator: ',', delimiter: '.') }
              column('Status') { |offer| status_tag offer.status }
            end
          else
            para 'Nenhuma oferta cadastrada.'
          end
        end
      end
    end

    panel 'Escopo administrativo' do
      para 'Produtos são catálogo global. Empresas & Produtos representam vínculos comerciais. Ofertas representam preço comercial da empresa.'
      para 'Categorias são compartilhadas entre empresas, produtos, busca, SEO e outros recursos da plataforma.'
      para 'Pricing e ProductAccess permanecem fora desta central; suas rotas e resources continuam preservados.'
    end
  end
end
