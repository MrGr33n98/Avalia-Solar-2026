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
      
      # Buscar produtos ativos da empresa
      products = company.products.active_status.limit(3)
      
      if products.empty?
        puts "  ⚠️  Empresa não tem produtos ativos. Pulando..."
        next
      end
      
      # Marcar os primeiros 3 produtos como featured
      products.each do |product|
        if product.update(featured: true)
          puts "  ✅ Produto marcado como featured: #{product.name} (ID: #{product.id})"
        else
          puts "  ❌ Erro ao marcar produto: #{product.errors.full_messages.join(', ')}"
        end
      end
      
      puts "  📊 Total de produtos featured: #{company.products.where(featured: true).count}"
    end
    
    puts "\n✨ Processo concluído!"
  end
  
  desc "Remove flag featured de todos os produtos"
  task unmark_all_featured_products: :environment do
    count = Product.where(featured: true).update_all(featured: false)
    puts "✅ #{count} produtos desmarcados como featured"
  end
end
