require 'rails_helper'

RSpec.describe 'Categories cards view', type: :request do
  def attach_png(record, name: 'banner.png')
    record.banner.attach(
      io: StringIO.new(FactoryBot::BANNER_1X1_PNG),
      filename: name,
      content_type: 'image/png'
    )
  end

  let!(:cat_expensive) do
    create(:category, name: 'Solar Panels', average_price: 10_000.0, average_rating: 4.5, views_count: 100,
                      featured: true)
  end
  let!(:cat_cheap) do
    create(:category, name: 'Cables', average_price: 50.0, average_rating: 3.0, views_count: 500, featured: false)
  end
  let!(:cat_popular) do
    create(:category, name: 'Inverters', average_price: 5000.0, average_rating: 5.0, views_count: 1000, featured: true)
  end

  before do
    # Add badges through companies
    # Create a company with a badge and associate it with the popular category
    badge = create(:badge, name: 'Top Seller', description: 'Best selling badge', active: true)
    company = create(:company, status: 'active')
    company.categories << cat_popular
    company.badges << badge
  end

  describe 'GET /api/v1/categories?view=cards' do
    context 'Basic Fields' do
      it 'returns correct fields including metrics' do
        get '/api/v1/categories', params: { view: 'cards' }

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)

        popular = body.find { |c| c['id'] == cat_popular.id }
        expect(popular['average_price']).to eq(5000.0)
        expect(popular['views_count']).to eq(1000)
        # Note: badges are now associated with companies, not categories
        # So this test just verifies the basic fields work
        expect(popular['tags']).to include('Destaque')
      end
    end

    context 'Filtering' do
      it 'filters by max_price' do
        get '/api/v1/categories', params: { view: 'cards', max_price: 100.0 }
        body = JSON.parse(response.body)
        ids = body.map { |c| c['id'] }

        expect(ids).to include(cat_cheap.id)
        expect(ids).not_to include(cat_expensive.id)
        expect(ids).not_to include(cat_popular.id)
      end

      it 'filters by min_rating' do
        get '/api/v1/categories', params: { view: 'cards', min_rating: 4.0 }
        body = JSON.parse(response.body)
        ids = body.map { |c| c['id'] }

        expect(ids).to include(cat_expensive.id)
        expect(ids).to include(cat_popular.id)
        expect(ids).not_to include(cat_cheap.id)
      end

      it 'filters by search term' do
        get '/api/v1/categories', params: { view: 'cards', search: 'Solar' }
        body = JSON.parse(response.body)
        expect(body.first['name']).to eq('Solar Panels')
        expect(body.length).to eq(1)
      end
    end

    context 'Sorting' do
      it 'sorts by price_desc' do
        get '/api/v1/categories', params: { view: 'cards', sort_by: 'price_desc' }
        body = JSON.parse(response.body)
        prices = body.map { |c| c['average_price'] }
        expect(prices).to eq([10_000.0, 5000.0, 50.0])
      end

      it 'sorts by views_desc' do
        get '/api/v1/categories', params: { view: 'cards', sort_by: 'views_desc' }
        body = JSON.parse(response.body)
        views = body.map { |c| c['views_count'] }
        expect(views).to eq([1000, 500, 100])
      end

      it 'sorts by rating_desc' do
        get '/api/v1/categories', params: { view: 'cards', sort_by: 'rating_desc' }
        body = JSON.parse(response.body)
        ratings = body.map { |c| c['average_rating'] }
        expect(ratings).to eq([5.0, 4.5, 3.0])
      end
    end

    context 'Pagination' do
      it 'returns metadata when page is present' do
        get '/api/v1/categories', params: { view: 'cards', page: 1, per_page: 1 }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json).to have_key('data')
        expect(json).to have_key('meta')
        expect(json['data'].length).to eq(1)
        expect(json['meta']['total_items']).to eq(3)
        expect(json['meta']['total_pages']).to eq(3)
      end
    end
  end
end
