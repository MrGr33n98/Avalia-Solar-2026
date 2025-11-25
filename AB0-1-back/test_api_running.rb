# Testar endpoints com servidor Rails rodando
require 'net/http'
require 'json'
require 'uri'

puts "Testing API endpoints with running Rails server..."

# Verificar se o servidor está rodando
begin
  # Testar /api/v1/leads
  uri = URI('http://localhost:3001/api/v1/leads')
  http = Net::HTTP.new(uri.host, uri.port)
  http.open_timeout = 5
  http.read_timeout = 5
  
  request = Net::HTTP::Get.new(uri)
  request['Accept'] = 'application/json'
  
  response = http.request(request)
  puts "✅ /api/v1/leads: Status #{response.code}"
  
  if response.code == '200'
    data = JSON.parse(response.body)
    puts "✅ Leads found: #{data.length}"
  else
    puts "⚠️ Response: #{response.body[0..200]}..."
  end
  
rescue => e
  puts "❌ /api/v1/leads: Error - #{e.message}"
end

# Testar /api/v1/companies/5/analytics/traffic
begin
  uri = URI('http://localhost:3001/api/v1/companies/5/analytics/traffic')
  http = Net::HTTP.new(uri.host, uri.port)
  http.open_timeout = 5
  http.read_timeout = 5
  
  request = Net::HTTP::Get.new(uri)
  request['Accept'] = 'application/json'
  
  response = http.request(request)
  puts "✅ /api/v1/companies/5/analytics/traffic: Status #{response.code}"
  
  if response.code == '200'
    data = JSON.parse(response.body)
    puts "✅ Analytics data received"
  else
    puts "⚠️ Response: #{response.body[0..200]}..."
  end
  
rescue => e
  puts "❌ /api/v1/companies/5/analytics/traffic: Error - #{e.message}"
end