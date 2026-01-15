if defined?(Rswag::Api)
  Rswag::Api.configure do |c|
    swagger_root = Rails.root.join('swagger').to_s

    # rswag-api 3.0 uses openapi_root
    c.openapi_root = swagger_root

    c.swagger_filter = lambda do |swagger, env|
      servers = swagger['servers']
      next unless servers.is_a?(Array)

      servers.each do |server|
        server['url'] = "#{env['rack.url_scheme']}://#{env['HTTP_HOST']}"
      end
    end
  end
end
