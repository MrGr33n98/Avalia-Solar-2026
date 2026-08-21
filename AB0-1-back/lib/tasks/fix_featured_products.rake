namespace :companies do
  desc "Marca produtos como featured para empresas de teste (WEG e GoodWe Brasil)"
  task mark_featured_products: :environment do
    companies = Company.where(slug: ['weg', 'goodwe-brasil'])
    
    companies.each do |company|
      puts "\n=== Processando #{company.name} (#{company.slug}) ==="
      
      # Verificar se tem plano pago
      unless company.has_paid_plan?
        puts "  ⚠️  Empresa não tem plano pago. Pulando..."
        next
      end
      
      # Priorizar produtos do catálogo (relação canônica)
      catalog_products = company.catalog_products.where(status: 'active').limit(3)
      legacy_products = company.products.active_status.limit(3)
      
      products_to_feature = catalog_products.any? ? catalog_products : legacy_products
      
      if products_to_feature.empty?
        puts "  ⚠️  Empresa não tem produtos ativos (nem catálogo nem legacy). Pulando..."
        next
      end
      
      puts "  📦 Usando #{catalog_products.any? ? 'catálogo' : 'produtos legacy'}"
      
      # Marcar os primeiros 3 produtos como featured
      products_to_feature.each do |product|
        if product.update(featured: true)
          puts "  ✅ Produto marcado como featured: #{product.name} (ID: #{product.id})"
        else
          puts "  ❌ Erro ao marcar produto: #{product.errors.full_messages.join(', ')}"
        end
      end
      
      # Contar total de produtos featured
      total_catalog_featured = company.catalog_products.where(featured: true).count
      total_legacy_featured = company.products.where(featured: true).count
      
      puts "  📊 Total de produtos featured:"
      puts "     - Catálogo: #{total_catalog_featured}"
      puts "     - Legacy: #{total_legacy_featured}"
    end
    
    puts "\n✨ Processo concluído!"
  end
  
  desc "Remove flag featured de todos os produtos"
  task unmark_all_featured_products: :environment do
    count = Product.where(featured: true).update_all(featured: false)
    puts "✅ #{count} produtos desmarcados como featured"
  end
  
  desc "Diagnóstico completo de produtos para WEG e GoodWe Brasil"
  task diagnose_featured_products: :environment do
    %w[weg goodwe-brasil].each do |slug|
      c = Company.find_by!(slug: slug)
      puts "\n" + "=" * 70
      puts "EMPRESA: #{c.name} (ID: #{c.id})"
      puts "=" * 70
      
      puts "\n📊 STATUS DO PLANO:"
      puts "  has_paid_plan?: #{c.has_paid_plan?}"
      puts "  plan_id: #{c.plan_id}"
      puts "  featured_products entitlement: #{c.feature_value_from_plan(:featured_products, include_defaults: true)}"
      
      puts "\n📦 PRODUTOS CATÁLOGO (company.catalog_products):"
      catalog_products = c.catalog_products.where(status: 'active')
      puts "  Total ativos: #{catalog_products.count}"
      puts "  Total featured: #{catalog_products.where(featured: true).count}"
      
      if catalog_products.any?
        puts "  Primeiros 3:"
        catalog_products.limit(3).each do |p|
          puts "    - #{p.name} (ID: #{p.id}, featured: #{p.featured || false})"
        end
      end
      
      puts "\n📦 PRODUTOS LEGACY (company.products):"
      legacy_products = c.products.active_status
      puts "  Total ativos: #{legacy_products.count}"
      puts "  Total featured: #{legacy_products.where(featured: true).count}"
      
      if legacy_products.any?
        puts "  Primeiros 3:"
        legacy_products.limit(3).each do |p|
          puts "    - #{p.name} (ID: #{p.id}, featured: #{p.featured || false})"
        end
      end
      
      puts "\n✨ OUTPUT featured_products_for_public:"
      featured = c.featured_products_for_public
      puts "  Count: #{featured.count}"
      featured.each { |fp| puts "    - #{fp[:name]} (ID: #{fp[:id]})" }
    end
    
    puts "\n" + "=" * 70
    puts "FIM DO DIAGNÓSTICO"
    puts "=" * 70
  end
end
