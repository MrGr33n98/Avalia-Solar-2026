require 'test_helper'

class Api::V1::ReviewsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @company_a = Company.create!(name: 'A')
    @company_b = Company.create!(name: 'B')
    @user = User.create!(email: 'u@test.com', password: 'password', name: 'U')
    @rev_a1 = Review.create!(company: @company_a, user: @user, rating: 5, comment: 'Excelente')
    @rev_a2 = Review.create!(company: @company_a, user: @user, rating: 4, comment: 'Bom')
    @rev_b1 = Review.create!(company: @company_b, user: @user, rating: 3, comment: 'Ok')
  end

  test 'should return only reviews for specific company' do
    get '/api/v1/reviews', params: { company_id: @company_a.id }, as: :json
    assert_response :success
    body = JSON.parse(@response.body)
    ids = body.map { |r| r['id'] }
    assert_includes ids, @rev_a1.id
    assert_includes ids, @rev_a2.id
    refute_includes ids, @rev_b1.id
  end

  test 'should not include reviews from other companies' do
    get '/api/v1/reviews', params: { company_id: @company_b.id }, as: :json
    assert_response :success
    body = JSON.parse(@response.body)
    ids = body.map { |r| r['id'] }
    assert_includes ids, @rev_b1.id
    refute_includes ids, @rev_a1.id
    refute_includes ids, @rev_a2.id
  end
end

