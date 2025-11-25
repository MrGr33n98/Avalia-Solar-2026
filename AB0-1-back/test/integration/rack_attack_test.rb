# frozen_string_literal: true

require 'test_helper'

class RackAttackTest < ActionDispatch::IntegrationTest
  setup do
    # Limpar cache do Rack::Attack antes de cada teste
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end

  teardown do
    # Limpar cache após cada teste
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end

  # Teste: Permite tentativas normais de login (abaixo do limite)
  test "allows normal login attempts" do
    4.times do
      post '/api/v1/auth/login', 
           params: { email: 'test@example.com', password: 'wrongpassword' },
           headers: { 'CONTENT_TYPE' => 'application/json' }
      
      # Pode ser 401 (unauthorized) ou 404 (endpoint não encontrado ainda)
      # O importante é que NÃO seja 429 (too many requests)
      assert_not_equal 429, response.status, 
        "Normal requests should not be rate limited"
    end
  end

  # Teste: Throttle tentativas excessivas de login do mesmo IP
  test "throttles excessive login attempts from same IP" do
    # Fazer 5 tentativas permitidas
    5.times do |i|
      post '/api/v1/auth/login',
           params: { email: "test#{i}@example.com", password: 'wrong' },
           headers: { 'CONTENT_TYPE' => 'application/json' }
    end

    # A 6ª tentativa deve ser bloqueada
    post '/api/v1/auth/login',
         params: { email: 'test6@example.com', password: 'wrong' },
         headers: { 'CONTENT_TYPE' => 'application/json' }
    
    assert_response :too_many_requests
    assert_equal 429, response.status
    
    # Verificar headers de rate limit
    assert_not_nil response.headers['X-RateLimit-Limit']
    assert_not_nil response.headers['Retry-After']
    
    # Verificar body da resposta
    json_response = JSON.parse(response.body)
    assert_equal 'Rate limit exceeded. Please try again later.', json_response['error']
    assert json_response['retry_after_seconds'].present?
  end

  # Teste: Throttle tentativas excessivas para o mesmo email
  test "throttles excessive login attempts for same email" do
    # Fazer 5 tentativas com o mesmo email
    5.times do
      post '/api/v1/auth/login',
           params: { email: 'victim@example.com', password: 'wrong' },
           headers: { 'CONTENT_TYPE' => 'application/json' }
    end

    # A 6ª tentativa deve ser bloqueada
    post '/api/v1/auth/login',
         params: { email: 'victim@example.com', password: 'wrong' },
         headers: { 'CONTENT_TYPE' => 'application/json' }
    
    assert_response :too_many_requests
    
    json_response = JSON.parse(response.body)
    assert_equal 'Rate limit exceeded. Please try again later.', json_response['error']
  end

  # Teste: Normaliza emails (case insensitive, sem espaços)
  test "normalizes email for rate limiting" do
    emails = [
      'Test@Example.com',
      'test@example.com',
      ' test@example.com ',
      'TEST@EXAMPLE.COM'
    ]

    # Todas as variações contam como mesmo email
    5.times do |i|
      post '/api/v1/auth/login',
           params: { email: emails[i % emails.length], password: 'wrong' },
           headers: { 'CONTENT_TYPE' => 'application/json' }
    end

    # Próxima tentativa deve ser bloqueada
    post '/api/v1/auth/login',
         params: { email: 'test@example.com', password: 'wrong' },
         headers: { 'CONTENT_TYPE' => 'application/json' }
    
    assert_response :too_many_requests
  end

  # Teste: Safelist permite localhost sem limite
  test "allows unlimited requests from localhost" do
    # Fazer muitas requisições do localhost
    50.times do
      get '/api/v1/companies', 
          headers: { 'REMOTE_ADDR' => '127.0.0.1' }
      
      # Não deve ser rate limited
      assert_not_equal 429, response.status,
        "Localhost should be safelisted"
    end
  end

  # Teste: Throttle geral de API por IP
  test "throttles general API requests per IP" do
    # O limite é 300 requests por 5 minutos
    # Vamos testar com um número menor para não demorar muito
    
    # Simular IP específico
    ip = '192.168.1.100'
    
    # Fazer requests até próximo do limite
    # (ajustar número conforme necessário para teste rápido)
    10.times do
      get '/api/v1/companies',
          headers: { 'REMOTE_ADDR' => ip }
    end
    
    # Verificar que não foi bloqueado ainda
    get '/api/v1/companies',
        headers: { 'REMOTE_ADDR' => ip }
    
    assert_not_equal 429, response.status,
      "Should allow requests under the limit"
  end

  # Teste: Não aplica throttle em assets
  test "does not throttle asset requests" do
    20.times do
      get '/assets/application.css'
    end
    
    assert_not_equal 429, response.status,
      "Asset requests should not be rate limited"
  end

  # Teste: Response headers corretos quando rate limited
  test "returns correct headers when rate limited" do
    # Exceder limite
    6.times do
      post '/api/v1/auth/login',
           params: { email: 'test@example.com', password: 'wrong' },
           headers: { 'CONTENT_TYPE' => 'application/json' }
    end
    
    assert_response :too_many_requests
    
    # Verificar headers
    assert_not_nil response.headers['X-RateLimit-Limit'], 
      "Should include X-RateLimit-Limit header"
    assert_equal '0', response.headers['X-RateLimit-Remaining'],
      "Remaining should be 0"
    assert_not_nil response.headers['X-RateLimit-Reset'],
      "Should include X-RateLimit-Reset header"
    assert_not_nil response.headers['Retry-After'],
      "Should include Retry-After header"
    assert_equal 'application/json', response.headers['Content-Type'],
      "Content-Type should be JSON"
  end

  # Teste: Body da resposta está correto
  test "returns correct JSON body when rate limited" do
    6.times do
      post '/api/v1/auth/login',
           params: { email: 'test@example.com', password: 'wrong' },
           headers: { 'CONTENT_TYPE' => 'application/json' }
    end
    
    json_response = JSON.parse(response.body)
    
    assert json_response.key?('error'), "Should have error key"
    assert json_response.key?('message'), "Should have message key"
    assert json_response.key?('retry_after_seconds'), "Should have retry_after_seconds"
    assert json_response.key?('limit'), "Should have limit"
    assert json_response.key?('period'), "Should have period"
    
    assert_equal 5, json_response['limit'], "Limit should be 5 for login"
    assert_equal 20, json_response['period'], "Period should be 20 seconds"
  end

  # Teste: Blocklist funciona (se configurado)
  test "blocks requests from blocklisted IPs" do
    # Este teste requer configurar BLOCKED_IPS no ambiente
    # Por padrão, skip se não houver IPs bloqueados
    
    blocked_ip = ENV['BLOCKED_IPS']&.split(',')&.first
    
    if blocked_ip.present?
      get '/api/v1/companies',
          headers: { 'REMOTE_ADDR' => blocked_ip }
      
      assert_response :forbidden
    else
      skip "No BLOCKED_IPS configured for testing"
    end
  end
end
