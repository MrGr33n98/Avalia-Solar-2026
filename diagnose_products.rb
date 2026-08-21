#!/usr/bin/env ruby
# Script para diagnosticar produtos das empresas WEG e GoodWe Brasil

%w[weg goodwe-brasil].each do |slug|
  c = Company.find_by!(slug: slug)
  puts "\n" + "=" * 60
  puts "EMPRESA: #{c.name} (ID: #{c.id})"
  puts "=" * 60
  
  puts "\n📊 STATUS DO PLANO:"
  puts "  has_paid_plan?: #{c.has_paid_plan?}"
  puts "  plan_id: #{c.plan_id}"
  puts "  plan_name: #{c.plan&.name || 'N/A'}"
  puts "  featured_products entitlement: #{c.feature_value_from_plan(:featured_products, include_defaults: true)}"
  
  puts "\n📦 PRODUTOS LEGACY (company.products):"
  legacy_products = c.products.active_status
  puts "  Total: #{legacy_products.count}"
  puts "  Featured: #{legacy_products.where(featured: true).count}"
  
  if legacy_products.any?
    puts "\n  Primeiros 3 produtos:"
    legacy_products.limit(3).each do |p|
      puts "    - #{p.name} (ID: #{p.id}, featured: #{p.featured || false})"
    end
  end
  
  puts "\n📦 PRODUTOS CATÁLOGO (company.catalog_products via company_products):"
  catalog_products = c.catalog_products.where(status: 'active')
  puts "  Total: #{catalog_products.count}"
  puts "  Featured: #{catalog_products.where(featured: true).count}"
  
  if catalog_products.any?
    puts "\n  Primeiros 3 produtos:"
    catalog_products.limit(3).each do |p|
      puts "    - #{p.name} (ID: #{p.id}, featured: #{p.featured || false})"
    end
  end
  
  puts "\n📦 COMPANY_PRODUCTS (join table):"
  company_products = c.company_products
  puts "  Total: #{company_products.count}"
  
  if company_products.any?
    puts "\n  Primeiros 3:"
    company_products.limit(3).each do |cp|
      product = cp.product
      puts "    - CompanyProduct ID: #{cp.id}, Product: #{product.name} (ID: #{product.id}, featured: #{product.featured || false})"
    end
  end
  
  puts "\n✨ OUTPUT ATUAL featured_products_for_public:"
  featured = c.featured_products_for_public
  puts "  Count: #{featured.count}"
  if featured.any?
    featured.each do |fp|
      puts "    - #{fp[:name]} (ID: #{fp[:id]})"
    end
  else
    puts "    (vazio)"
  end
end

puts "\n" + "=" * 60
puts "FIM DO DIAGNÓSTICO"
puts "=" * 60
