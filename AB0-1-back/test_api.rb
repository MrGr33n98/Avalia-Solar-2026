# Test script para verificar endpoints da API
require 'net/http'
require 'json'
require 'uri'

puts "Testing API endpoints..."

# Test /api/v1/leads
begin
  uri = URI('http://localhost:3001/api/v1/leads')
  http = Net::HTTP.new(uri.host, uri.port)
  request = Net::HTTP::Get.new(uri)
  request['Accept'] = 'application/json'
  
  response = http.request(request)
  puts "✅ /api/v1/leads: Status #{response.code}"
  puts "Response: #{response.body[0..200]}..." if response.body
rescue => e
  puts "❌ /api/v1/leads: Error - #{e.message}"
end

# Test /api/v1/companies/5/analytics/traffic  
begin
  uri = URI('http://localhost:3001/api/v1/companies/5/analytics/traffic')
  http = Net::HTTP.new(uri.host, uri.port)
  request = Net::HTTP::Get.new(uri)
  request['Accept'] = 'application/json'
  
  response = http.request(request)
  puts "✅ /api/v1/companies/5/analytics/traffic: Status #{response.code}"
  puts "Response: #{response.body[0..200]}..." if response.body
rescue => e
  puts "❌ /api/v1/companies/5/analytics/traffic: Error - #{e.message}"
end