# Script to create products related to existing companies and categories
require_relative '../config/environment'

puts 'Starting to create products related to companies and categories...'

# Get existing companies and categories
companies = Company.all
categories = Category.all

if companies.empty?
  puts 'No companies found. Please run the populate_admin_data.rb script first.'
  exit
end

if categories.empty?
  puts 'No categories found. Please run the populate_admin_data.rb script first.'
  exit
end

# Create Products
puts 'Creating products...'

# Product names by category type
tech_products = ['Smartphone Pro', 'Laptop Ultra', 'Smart Watch', 'Wireless Earbuds', 'Tablet Max', 'Gaming PC',
                 'Bluetooth Speaker', 'Wireless Mouse', 'Mechanical Keyboard', 'External SSD']
health_products = ['Fitness Tracker', 'Smart Scale', 'Massage Gun', 'Vitamin Supplements', 'Yoga Mat',
                   'Resistance Bands', 'Blood Pressure Monitor', 'Air Purifier', 'Meditation Headband', 'Protein Powder']
home_products = ['Coffee Maker', 'Blender', 'Air Fryer', 'Smart TV', 'Robot Vacuum', 'Toaster Oven', 'Pressure Cooker',
                 'Stand Mixer', 'Bed Sheets', 'Throw Pillows']
sports_products = ['Running Shoes', 'Yoga Pants', 'Dumbbells', 'Basketball', 'Tennis Racket', 'Golf Clubs', 'Bicycle',
                   'Hiking Backpack', 'Swimming Goggles', 'Fitness Gloves']
food_products = ['Organic Coffee', 'Protein Bars', 'Olive Oil', 'Specialty Tea', 'Dark Chocolate', 'Granola',
                 'Dried Fruits', 'Nut Butter', 'Honey', 'Spice Set']

# Create 10 products for each company, related to appropriate categories
companies.each do |company|
  puts "Creating products for company: #{company.name}"

  # Determine which product types fit this company based on name/description
  product_types = []
  company_keywords = (company.name + company.description).downcase

  product_types << tech_products if company_keywords.match?(/tech|solution|digital|electronic/)
  product_types << health_products if company_keywords.match?(/health|wellness|fitness|medical/)
  product_types << home_products if company_keywords.match?(/home|decor|retail|furniture/)
  product_types << sports_products if company_keywords.match?(/sport|fitness|athletic|outdoor/)
  product_types << food_products if company_keywords.match?(/food|delivery|nutrition|eat/)

  # If no specific match, use all product types
  if product_types.empty?
    product_types = [tech_products, health_products, home_products, sports_products,
                     food_products]
  end

  # Flatten the array of product types
  all_products = product_types.flatten

  # Create 5 products for this company
  5.times do |i|
    product_name = all_products.sample

    product = Product.create!(
      name: "#{product_name} #{rand(100..999)}",
      description: "High-quality #{product_name.downcase} with advanced features and excellent performance. Made by #{company.name}.",
      short_description: "Premium #{product_name.downcase} by #{company.name}.",
      price: rand(50.0..1000.0).round(2),
      sku: "#{company.name[0..2].upcase}-#{rand(1000..9999)}",
      stock: rand(0..100),
      status: %w[active out_of_stock discontinued].sample,
      featured: [true, false].sample,
      seo_title: "Buy #{product_name} - Best Price from #{company.name}",
      seo_description: "Find the best prices for #{product_name} with free shipping and warranty from #{company.name}.",
      company_id: company.id
    )

    # Find appropriate categories for this product
    appropriate_categories = []

    if tech_products.include?(product_name)
      appropriate_categories = categories.select do |c|
        c.name.downcase.include?('tecnologia') || c.name.downcase.include?('tech')
      end
    elsif health_products.include?(product_name)
      appropriate_categories = categories.select do |c|
        c.name.downcase.include?('saúde') || c.name.downcase.include?('health')
      end
    elsif home_products.include?(product_name)
      appropriate_categories = categories.select do |c|
        c.name.downcase.include?('casa') || c.name.downcase.include?('decoração')
      end
    elsif sports_products.include?(product_name)
      appropriate_categories = categories.select do |c|
        c.name.downcase.include?('esporte') || c.name.downcase.include?('sport')
      end
    elsif food_products.include?(product_name)
      appropriate_categories = categories.select do |c|
        c.name.downcase.include?('alimentação') || c.name.downcase.include?('food')
      end
    end

    # If no appropriate categories found, use random ones
    appropriate_categories = categories.sample(2) if appropriate_categories.empty?

    # Associate with 1-2 appropriate categories
    product.categories << appropriate_categories.sample(rand(1..2))

    # Try to attach an image if available
    begin
      if File.exist?("#{Rails.root}/public/sample_images/product_#{(i % 10) + 1}.jpg")
        product.image.attach(
          io: File.open("#{Rails.root}/public/sample_images/product_#{(i % 10) + 1}.jpg"),
          filename: "product_#{company.id}_#{i}.jpg",
          content_type: 'image/jpeg'
        )
      end
    rescue StandardError => e
      puts "Warning: Could not attach image to product #{product.name}: #{e.message}"
    end

    puts "  Created product: #{product.name} for company: #{company.name}"
  end
end

puts 'Finished creating related products!'
