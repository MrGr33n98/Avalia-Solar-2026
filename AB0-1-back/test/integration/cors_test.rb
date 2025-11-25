# frozen_string_literal: true

require 'test_helper'

class CorsTest < ActionDispatch::IntegrationTest
  # Helper para mudar Rails.env temporariamente
  def with_rails_env(env)
    original_env = Rails.env
    Rails.env = ActiveSupport::StringInquirer.new(env.to_s)
    yield
  ensure
    Rails.env = ActiveSupport::StringInquirer.new(original_env)
  end

  # Teste: Permite requests de localhost em development
  test "allows requests from localhost in development" do
    with_rails_env(:development) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'http://localhost:3000' }

      # Verificar header CORS
      assert_equal 'http://localhost:3000',
        response.headers['Access-Control-Allow-Origin'],
        "Should allow localhost origin in development"
      
      assert_equal 'true',
        response.headers['Access-Control-Allow-Credentials'],
        "Should allow credentials"
    end
  end

  # Teste: Permite requests de 127.0.0.1 em development
  test "allows requests from 127.0.0.1 in development" do
    with_rails_env(:development) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'http://127.0.0.1:3000' }

      assert_equal 'http://127.0.0.1:3000',
        response.headers['Access-Control-Allow-Origin']
    end
  end

  # Teste: Permite domain correto em production
  test "allows requests from allowed origin in production" do
    with_rails_env(:production) do
      # Simular request do frontend de produção
      get '/api/v1/companies',
        headers: { 'Origin' => 'https://www.avaliasolar.com.br' }

      assert_equal 'https://www.avaliasolar.com.br',
        response.headers['Access-Control-Allow-Origin'],
        "Should allow production domain"
      
      assert_equal 'true',
        response.headers['Access-Control-Allow-Credentials']
    end
  end

  # Teste: Permite origin alternativo em production
  test "allows alternative origin in production" do
    with_rails_env(:production) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'https://avaliasolar.com.br' }

      assert_equal 'https://avaliasolar.com.br',
        response.headers['Access-Control-Allow-Origin']
    end
  end

  # Teste: Bloqueia origins não autorizadas em production
  test "blocks unauthorized origin in production" do
    with_rails_env(:production) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'https://malicious-site.com' }

      # CORS não deve adicionar header se origin não é permitida
      assert_nil response.headers['Access-Control-Allow-Origin'],
        "Should not allow unauthorized origin"
    end
  end

  # Teste: Bloqueia localhost em production
  test "blocks localhost in production" do
    with_rails_env(:production) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'http://localhost:3000' }

      assert_nil response.headers['Access-Control-Allow-Origin'],
        "Should not allow localhost in production"
    end
  end

  # Teste: Preflight request (OPTIONS)
  test "handles preflight OPTIONS request" do
    with_rails_env(:development) do
      options '/api/v1/companies',
        headers: {
          'Origin' => 'http://localhost:3000',
          'Access-Control-Request-Method' => 'POST',
          'Access-Control-Request-Headers' => 'Content-Type, Authorization'
        }

      assert_response :success
      
      # Verificar headers CORS de preflight
      assert_equal 'http://localhost:3000',
        response.headers['Access-Control-Allow-Origin']
      
      allowed_methods = response.headers['Access-Control-Allow-Methods']
      assert_includes allowed_methods, 'POST',
        "Should allow POST method"
      assert_includes allowed_methods, 'GET',
        "Should allow GET method"
      
      # Verificar max-age (cache de preflight)
      assert_equal '3600',
        response.headers['Access-Control-Max-Age'],
        "Should cache preflight for 1 hour"
    end
  end

  # Teste: Expõe headers corretos
  test "exposes correct headers" do
    with_rails_env(:development) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'http://localhost:3000' }

      exposed_headers = response.headers['Access-Control-Expose-Headers']
      
      # Verificar que headers importantes estão expostos
      assert_includes exposed_headers, 'Authorization',
        "Should expose Authorization header"
      assert_includes exposed_headers, 'X-RateLimit-Limit',
        "Should expose rate limit headers"
      assert_includes exposed_headers, 'X-RateLimit-Remaining'
      assert_includes exposed_headers, 'Retry-After'
    end
  end

  # Teste: Permite métodos HTTP corretos
  test "allows correct HTTP methods" do
    with_rails_env(:development) do
      %w[GET POST PUT PATCH DELETE OPTIONS HEAD].each do |method|
        options '/api/v1/companies',
          headers: {
            'Origin' => 'http://localhost:3000',
            'Access-Control-Request-Method' => method
          }

        allowed_methods = response.headers['Access-Control-Allow-Methods']
        assert_includes allowed_methods, method,
          "Should allow #{method} method"
      end
    end
  end

  # Teste: Active Storage não requer credentials
  test "Active Storage does not require credentials" do
    with_rails_env(:development) do
      get '/rails/active_storage/blobs/redirect/test.jpg',
        headers: { 'Origin' => 'http://localhost:3000' }

      # Active Storage pode ter credentials false
      credentials = response.headers['Access-Control-Allow-Credentials']
      # Pode ser nil ou 'false', ambos são válidos
      assert credentials != 'true',
        "Active Storage should not require credentials"
    end
  end

  # Teste: Health check endpoint permite CORS
  test "health check endpoint allows CORS without credentials" do
    with_rails_env(:development) do
      get '/health',
        headers: { 'Origin' => 'http://localhost:3000' }

      assert_equal 'http://localhost:3000',
        response.headers['Access-Control-Allow-Origin'],
        "Health check should allow CORS"
    end
  end

  # Teste: Staging environment configuration
  test "allows staging domains in staging environment" do
    with_rails_env(:staging) do
      get '/api/v1/companies',
        headers: { 'Origin' => 'https://staging.avaliasolar.com.br' }

      assert_equal 'https://staging.avaliasolar.com.br',
        response.headers['Access-Control-Allow-Origin'],
        "Should allow staging domain"
    end
  end

  # Teste: ADDITIONAL_ALLOWED_ORIGINS via ENV
  test "allows additional origins from environment variable" do
    with_rails_env(:production) do
      # Simular ENV variable
      ClimateControl.modify(
        ADDITIONAL_ALLOWED_ORIGINS: 'https://partner.com,https://app.partner.com'
      ) do
        get '/api/v1/companies',
          headers: { 'Origin' => 'https://partner.com' }

        # Este teste pode falhar se ClimateControl não estiver disponível
        # Nesse caso, testar manualmente com ENV configurado
        if defined?(ClimateControl)
          assert_equal 'https://partner.com',
            response.headers['Access-Control-Allow-Origin']
        else
          skip "ClimateControl gem not available for ENV testing"
        end
      end
    end
  end
end
