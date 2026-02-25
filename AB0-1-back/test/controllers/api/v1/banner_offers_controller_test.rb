require 'test_helper'

class Api::V1::BannerOffersControllerTest < ActionDispatch::IntegrationTest
  test 'should list active offers' do
    BannerOffer.create!(name: 'Oferta 1', price_cents: 1000, currency: 'BRL', duration_days: 30, rules_json: {},
                        active: true)
    BannerOffer.create!(name: 'Oferta 2', price_cents: 2000, currency: 'BRL', duration_days: 30, rules_json: {},
                        active: false)

    get '/api/v1/banner_offers'
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 1, body['offers'].size
    assert_equal 'Oferta 1', body['offers'][0]['name']
  end
end
