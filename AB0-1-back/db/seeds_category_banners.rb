# Seeds for Category Banners
# Run with: rails runner db/seeds_category_banners.rb

require 'open-uri'

puts "🎨 Setting up category banners..."

# Banner images (you can replace these URLs with your own images)
banner_images = {
  'Inversores Solares' => 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'Baterias de Armazenamento' => 'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'Sistemas Off-Grid' => 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'Painéis Solares' => 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  'BSol Energia Solar' => 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80'
}

banner_images.each do |category_name, image_url|
  category = Category.find_by(name: category_name)
  
  if category
    puts "📸 Adding banner to #{category_name}..."
    
    begin
      # Download image
      file = URI.open(image_url)
      
      # Attach banner
      category.banner.attach(
        io: file,
        filename: "#{category.seo_url}-banner.jpg",
        content_type: 'image/jpeg'
      )
      
      puts "✅ Banner added successfully to #{category_name}"
    rescue => e
      puts "❌ Error adding banner to #{category_name}: #{e.message}"
    end
  else
    puts "⚠️  Category '#{category_name}' not found"
  end
end

puts "🎉 Category banner setup complete!"
puts "\nTo run this seeder:"
puts "cd /Users/felipemorais/AB0-1/AB0-1-back"
puts "rails runner db/seeds_category_banners.rb"

puts "\nTo view categories with banners:"
puts "- Admin: http://localhost:3001/admin/categories"
puts "- API: http://localhost:3001/api/v1/categories"
puts "- Frontend: http://localhost:3000/categories/inversores-solares"