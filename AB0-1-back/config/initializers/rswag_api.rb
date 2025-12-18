Rswag::Api.configure do |c|

  # Specify a root folder where Swagger JSON files are located
  # This is used by the Rswag middleware to serve Swagger JSON files
  # from specific URL paths
  c.swagger_root = Rails.root.to_s + '/swagger'

  # Inject a lambda function to alter the returned Swagger JSON
  # prior to being served. The function will be passed the rack env and swagger hash
  # For example, you might want to update the server URL based on the current environment
  c.swagger_filter = lambda { |swagger, env| swagger['servers'].each { |server| server['url'] = env['rack.url_scheme'] + '://' + env['HTTP_HOST'] } }
end
