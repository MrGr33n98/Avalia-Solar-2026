# Script to populate ActiveAdmin with realistic data
require_relative '../config/environment'

puts 'Starting to populate ActiveAdmin with realistic data...'

# Create Companies
puts 'Creating companies...'
10.times do |i|
  company = Company.create!(
    name: ['Tech Solutions', 'Green Energy', 'Health Plus', 'Global Finance', 'Smart Retail', 'Food Delivery',
           'Travel Agency', 'Education Hub', 'Sports Gear', 'Home Decor'][i],
    description: "A leading company in the #{['technology', 'energy', 'healthcare', 'finance', 'retail', 'food',
                                              'travel', 'education', 'sports', 'home decoration'][i]} sector.",
    website: "https://www.#{%w[tech-solutions green-energy health-plus global-finance smart-retail
                               food-delivery travel-agency education-hub sports-gear home-decor][i].downcase}.com",
    phone: "+1 #{rand(200..999)}-#{rand(100..999)}-#{rand(1000..9999)}",
    address: "#{rand(100..999)} #{['Main St', 'Broadway', 'Park Ave', 'Market St', '5th Avenue', 'Oak Street',
                                   'Pine Road', 'Cedar Lane', 'Maple Drive', 'Elm Boulevard'][i]}, #{['New York', 'Los Angeles', 'Chicago', 'Houston',
                                                                                                      'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'][i]}"
  )
  puts "Created company: #{company.name}"
end

# Create Categories
puts 'Creating categories...'
main_categories = [
  { name: 'Tecnologia', description: 'Produtos e serviços tecnológicos', kind: 'main', status: 'active',
    featured: true },
  { name: 'Saúde', description: 'Produtos e serviços de saúde', kind: 'main', status: 'active', featured: true },
  { name: 'Casa e Decoração', description: 'Produtos para casa e decoração', kind: 'main', status: 'active',
    featured: false },
  { name: 'Esportes', description: 'Equipamentos e serviços esportivos', kind: 'main', status: 'active',
    featured: true },
  { name: 'Alimentação', description: 'Produtos alimentícios', kind: 'main', status: 'active', featured: false }
]

main_categories.each do |cat_data|
  category = Category.create!(
    name: cat_data[:name],
    description: cat_data[:description],
    short_description: cat_data[:description][0..50],
    seo_title: "#{cat_data[:name]} - Melhores opções",
    seo_url: cat_data[:name].parameterize,
    kind: cat_data[:kind],
    status: cat_data[:status],
    featured: cat_data[:featured]
  )

  # Add banner to category
  if File.exist?("#{Rails.root}/public/sample_images/category_#{(category.id % 5) + 1}.jpg")
    category.banner.attach(
      io: File.open("#{Rails.root}/public/sample_images/category_#{(category.id % 5) + 1}.jpg"),
      filename: "category_#{category.id}.jpg",
      content_type: 'image/jpeg'
    )
  end

  puts "Created category: #{category.name}"

  # Create subcategories
  3.times do |j|
    subcategory = Category.create!(
      name: "#{category.name} - Subcategoria #{j + 1}",
      description: "Subcategoria de #{category.name}",
      short_description: "Subcategoria #{j + 1} de #{category.name}",
      seo_title: "#{category.name} - Subcategoria #{j + 1}",
      seo_url: "#{category.name.parameterize}-subcategoria-#{j + 1}",
      parent_id: category.id,
      kind: 'sub',
      status: 'active',
      featured: [true, false].sample
    )
    puts "  Created subcategory: #{subcategory.name}"
  end
end

# Create Products
puts 'Creating products...'
companies = Company.all
categories = Category.all

50.times do |i|
  company = companies.sample
  product = Product.create!(
    name: ['Smartphone Pro', 'Laptop Ultra', 'Smart Watch', 'Wireless Earbuds', 'Fitness Tracker',
           'Coffee Maker', 'Blender', 'Air Fryer', 'Smart TV', 'Gaming Console'].sample + " #{i + 1}",
    description: 'High-quality product with advanced features and excellent performance.',
    short_description: 'High-quality product with advanced features.',
    price: rand(50.0..1000.0).round(2),
    sku: "PROD-#{rand(1000..9999)}",
    stock: rand(0..100),
    status: %w[active out_of_stock discontinued].sample,
    featured: [true, false].sample,
    seo_title: "Buy Product #{i + 1} - Best Price",
    seo_description: "Find the best prices for Product #{i + 1} with free shipping and warranty.",
    company_id: company.id
  )

  # Associate with 1-3 categories
  product.categories << categories.sample(rand(1..3))

  # Add image to product
  if File.exist?("#{Rails.root}/public/sample_images/product_#{(i % 10) + 1}.jpg")
    product.image.attach(
      io: File.open("#{Rails.root}/public/sample_images/product_#{(i % 10) + 1}.jpg"),
      filename: "product_#{i}.jpg",
      content_type: 'image/jpeg'
    )
  end

  puts "Created product: #{product.name} for company: #{company.name}"
end

puts 'Finished populating ActiveAdmin with realistic data!'
