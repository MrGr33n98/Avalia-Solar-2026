require_relative 'config/environment'

begin
  base_scope = Company.active.includes(:categories, :badges, :company_buttons, :plan, :company_financing_profile).serving_city_strict('Cuiabá', 'MT')
  filtered_scope = base_scope.joins(:categories).where(categories: { id: [73] }).distinct
  
  puts "COUNT: #{filtered_scope.count}"
  puts "PAGINATED: #{filtered_scope.page(1).per(12).map(&:id)}"
  
  puts "FEATURED: #{filtered_scope.where('featured = ? OR sponsored = ? OR verified = ?', true, true, true).limit(6).map(&:id)}"
  
  puts "CATEGORIES PAYLOAD: #{Category.joins(:companies).where(companies: { id: base_scope.select(:id) }).group('categories.id').select('categories.*, COUNT(DISTINCT companies.id) AS local_companies_count').limit(1).map(&:id)}"
rescue => e
  puts "ERROR: #{e.class} - #{e.message}"
  puts e.backtrace[0..10].join("\n")
end
