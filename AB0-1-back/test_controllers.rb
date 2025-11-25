# Testar endpoints diretamente no Rails console
require_relative 'config/environment'

puts "Testing LeadsController..."

# Simular uma requisição para leads
begin
  controller = Api::V1::LeadsController.new
  controller.params = { status: 'pending' }
  result = controller.index
  puts "✅ LeadsController#index result: #{result}"
rescue => e
  puts "❌ LeadsController#index error: #{e.message}"
  puts e.backtrace[0..5]
end

puts "\nTesting CompaniesController..."

# Simular uma requisição para analytics/traffic
begin
  controller = Api::V1::CompaniesController.new
  controller.params = { id: '5' }
  result = controller.analytics_traffic
  puts "✅ CompaniesController#analytics_traffic result: #{result}"
rescue => e
  puts "❌ CompaniesController#analytics_traffic error: #{e.message}"
  puts e.backtrace[0..5]
end