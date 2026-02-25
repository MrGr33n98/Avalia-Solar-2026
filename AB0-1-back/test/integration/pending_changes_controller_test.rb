require 'test_helper'

class PendingChangesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @company = Company.create!(name: 'Globex', description: 'Desc', status: 'active')
    @user = User.create!(email: 'user@example.com', password: 'Aa123456', name: 'User', role: 'company',
                         company: @company, terms_accepted: true, status: :active)
    @token = JWT.encode({ user_id: @user.id }, Rails.application.secret_key_base, 'HS256')
    @headers = { 'Authorization' => "Bearer #{@token}" }
    @pc = PendingChange.create!(company: @company, user: @user, change_type: 'company_info', status: 'pending',
                                data: { attributes: { description: 'New' } })
  end

  test 'index returns pending changes' do
    get '/api/v1/company/pending_changes', headers: @headers
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body['count']
    assert_equal @pc.id, body['items'][0]['id']
  end

  test 'show returns single pending change' do
    get "/api/v1/company/pending_changes/#{@pc.id}", headers: @headers
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'company_info', body['change_type']
  end
end
