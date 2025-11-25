# Verificar schema da tabela leads
require_relative 'config/environment'

puts "Lead table columns:"
Lead.column_names.each do |column|
  puts "- #{column}"
end

puts "\nLead table structure:"
puts Lead.inspect