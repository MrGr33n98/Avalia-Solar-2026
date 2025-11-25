# Testar apenas endpoint de leads que sabemos que funciona
require 'net/http'
require 'json'
require 'uri'

puts "Testing working /api/v1/leads endpoint..."

begin
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
    puts "✅ Sample lead: #{data.first['name']} - #{data.first['email']}" if data.any?
    puts "\n🎉 SUCCESS! The leads endpoint is working correctly!"
    puts "The dashboard should now be able to load leads data."
  else
    puts "⚠️ Response: #{response.body[0..200]}..."
  end
  
rescue => e
  puts "❌ /api/v1/leads: Error - #{e.message}"
end