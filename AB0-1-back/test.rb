env = Rack::MockRequest.env_for('/api/v1/local_solar_pages/mt/cuiaba', params: { 'category_ids' => ['73'] })
status, headers, body = Rails.application.call(env)
File.write('test_out.txt', "Status: #{status}\nBody: #{body.join}")
