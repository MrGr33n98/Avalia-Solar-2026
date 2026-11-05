# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Service pages, review attribution and SEO', type: :request do
  let!(:company) { create(:company, status: :active, name: 'Empresa Exemplo', slug: 'empresa-exemplo') }
  let!(:other_company) { create(:company, status: :active) }
  let!(:category) { create(:category, name: 'Armazenamento', seo_url: 'armazenamento') }
  let!(:service) do
    CompanyService.create!(
      company: company, category: category,
      name: 'Armazenamento de Energia',
      slug: 'armazenamento-de-energia',
      status: 'active',
      description: 'Projeto e instalação de sistemas de armazenamento.',
      video_links: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']
    )
  end

  def service_json
    get "/api/v1/companies/#{company.id}/services/#{service.slug}"
    JSON.parse(response.body)
  end

  it 'exposes published service content and real media, never invented reviews' do
    payload = service_json
    expect(response).to have_http_status(:ok)
    expect(payload.dig('data', 'name')).to eq(service.name)
    expect(payload.dig('data', 'video_links')).to eq(service.video_links)
    expect(payload.dig('data', 'image_urls')).to eq([])
    expect(payload.dig('data', 'review_summary', 'count')).to eq(0)
    expect(payload.dig('data', 'review_summary', 'average')).to be_nil
    expect(payload.dig('data', 'reviews')).to eq([])
  end

  it 'counts only approved reviews attributed to this exact service' do
    create(:review, company: company, category: category, user: create(:user, company: other_company),
           rating: 5, status: :approved, reviewable: service, comment: 'Instalação bem executada.')
    create(:review, company: company, category: category, user: create(:user, company: other_company),
           rating: 1, status: :pending, reviewable: service, comment: 'Aguardando moderação.')
    create(:review, company: company, category: category, user: create(:user, company: other_company),
           rating: 2, status: :approved, comment: 'Avaliação geral da empresa.')

    payload = service_json.dig('data')
    expect(payload.dig('review_summary', 'count')).to eq(1)
    expect(payload.dig('review_summary', 'average')).to eq(5.0)
    expect(payload['reviews'].length).to eq(1)
    expect(payload['reviews'].first['comment']).to eq('Instalação bem executada.')
  end

  it 'hides inactive services even when the parent company is visible' do
    service.update!(status: 'inactive')
    get "/api/v1/companies/#{company.id}/services/#{service.slug}"
    expect(response).to have_http_status(:not_found)
  end

  it 'includes only published services in SEO sitemap' do
    CompanyService.create!(company: company, category: category, name: 'Rascunho',
                           slug: 'rascunho', status: 'inactive')
    get '/api/v1/sitemaps/services', params: { page: 1, per_page: 50 }
    expect(response).to have_http_status(:ok)
    slugs = JSON.parse(response.body).fetch('data').map { |row| row['service_slug'] }
    expect(slugs).to include(service.slug)
    expect(slugs).not_to include('rascunho')
  end

  it 'rejects non-approved video hosts' do
    service.video_links = ['https://example.com/servico']
    expect(service).not_to be_valid
    expect(service.errors[:video_links]).to be_present
  end

  it 'rejects service review attribution to another company' do
    reviewer = create(:user, company: other_company)
    allow_any_instance_of(Api::V1::BaseController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(reviewer)

    post '/api/v1/reviews', params: {
      review: {
        company_id: other_company.id, service_id: service.id,
        category_id: category.id, rating: 5,
        comment: 'Tentativa de atribuição cruzada.',
        capture_flow_source: 'profile'
      }
    }, as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['errors']).to include('Serviço não encontrado nesta empresa.')
  end
end
