company = Company.find_by(slug: 'ezvolt-brasil')
if company
  puts "Found: #{company.name}"
  puts "ID: #{company.id}"
  puts "Slug: #{company.slug}"
  puts "Status: #{company.status}"
else
  puts 'Company not found with slug: ezvolt-brasil'
  puts 'Existing slugs (first 10):'
  puts Company.limit(10).pluck(:slug).join(', ')
end
