require 'net/http'
require 'json'

uri = URI('http://localhost:3001/api/v1/local_solar_pages/mt/cuiaba')
res = Net::HTTP.get_response(uri)
puts "Status: #{res.code}"
puts "Body: #{res.body[0..200]}"
