require 'rails_helper'

RSpec.describe 'Faqs API', type: :request do
  describe 'GET /api/v1/faqs' do
    it 'returns active faqs filtered by category' do
      create(:company) # ensure deps
      faq_a = Faq.create!(question: 'Como contratar?', answer: 'Pelo site', category: 'geral', position: 1,
                          active: true)
      Faq.create!(question: 'Inativo', answer: 'N/A', category: 'geral', active: false)
      faq_b = Faq.create!(question: 'Garantia', answer: '12 meses', category: 'pos-venda', active: true)

      get '/api/v1/faqs', params: { category: 'pos-venda' }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['faqs'].first['id']).to eq(faq_b.id)
      expect(body['faqs'].map { |f| f['id'] }).not_to include(faq_a.id)
    end
  end

  describe 'POST /api/v1/faqs/:id/vote' do
    it 'increments helpful counters' do
      faq = Faq.create!(question: 'Entrega', answer: 'Em ate 7 dias', category: 'logistica', helpful_yes: 1,
                        helpful_no: 0)

      post "/api/v1/faqs/#{faq.id}/vote", params: { helpful: true }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['faq']['helpful_yes']).to eq(2)
    end
  end
end
