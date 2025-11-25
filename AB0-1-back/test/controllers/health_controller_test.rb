# frozen_string_literal: true

require 'test_helper'

class HealthControllerTest < ActionDispatch::IntegrationTest
  test 'should get basic health status' do
    get '/health'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    assert_equal 'ok', json_response['status']
    assert json_response['timestamp'].present?
  end

  test 'should get readiness check' do
    get '/health/readiness'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    assert_includes ['ready', 'not_ready'], json_response['status']
    assert json_response['checks'].present?
    assert json_response['checks']['database'].present?
    assert json_response['timestamp'].present?
  end

  test 'should get liveness check' do
    get '/health/liveness'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    assert_equal 'alive', json_response['status']
    assert json_response['timestamp'].present?
  end

  test 'should get detailed health information' do
    get '/health/details'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    assert_equal 'ok', json_response['status']
    assert json_response['version'].present?
    assert json_response['environment'].present?
    assert json_response['ruby_version'].present?
    assert json_response['rails_version'].present?
    assert json_response['system'].present?
    assert json_response['checks'].present?
  end

  test 'readiness check should verify database connection' do
    get '/health/readiness'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    database_check = json_response['checks']['database']
    
    assert database_check.present?
    assert_equal 'ok', database_check['status']
    assert database_check['response_time_ms'].is_a?(Numeric)
  end

  test 'readiness check should verify redis connection' do
    get '/health/readiness'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    redis_check = json_response['checks']['redis']
    
    assert redis_check.present?
    assert_includes ['ok', 'error', 'not_configured'], redis_check['status']
  end

  test 'readiness check should verify sidekiq status' do
    get '/health/readiness'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    sidekiq_check = json_response['checks']['sidekiq']
    
    assert sidekiq_check.present?
    assert_includes ['ok', 'warning', 'error', 'not_configured'], sidekiq_check['status']
  end

  test 'details check should include system information' do
    get '/health/details'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    system_info = json_response['system']
    
    assert system_info.present?
    assert system_info['uptime'].present?
    assert system_info['memory'].present?
    assert system_info['disk'].present?
  end

  test 'details check should include all checks' do
    get '/health/details'
    assert_response :success
    
    json_response = JSON.parse(response.body)
    checks = json_response['checks']
    
    assert checks['database'].present?
    assert checks['redis'].present?
    assert checks['sidekiq'].present?
    assert checks['active_storage'].present?
  end

  test 'health endpoints should not require authentication' do
    # Clear any authentication
    @request&.headers&.delete('Authorization')
    
    get '/health'
    assert_response :success
    
    get '/health/readiness'
    assert_response :success
    
    get '/health/liveness'
    assert_response :success
    
    get '/health/details'
    assert_response :success
  end
end
