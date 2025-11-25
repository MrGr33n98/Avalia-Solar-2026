require 'test_helper'

class ContentFeedControllerTest < ActionDispatch::IntegrationTest
  def setup
    @company = Company.create!(name: 'C', description: 'D')
    @category = Category.create!(name: 'Solar', description: 'Energy')
    Article.create!(title: 'Organic A', content: 'Body', category: @category, company: @company)
    Article.create!(title: 'Sponsored A', content: 'Body', category: @category, company: @company, sponsored: true)
  end

  test 'GET /api/v1/content_feed returns success and payload' do
    get '/api/v1/content_feed', params: { company_id: @company.id, limit: 5 }
    assert_response :success
    body = JSON.parse(response.body)
    assert body.is_a?(Array)
    assert body.any? { |item| item['type'] == 'article' }
  end
end
