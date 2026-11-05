# frozen_string_literal: true

require 'rails_helper'
require 'base64'
require 'tempfile'

RSpec.describe 'Company service media and public page contract', type: :request do
  let(:company) { create(:company, status: :active) }
  let(:user) { create(:user, company: company, status: :active, approved_by_admin: true, confirmed_at: Time.current) }
  let(:category) { create(:category, name: 'Armazenamento de energia') }
  let(:token) { JWT.encode({ user_id: user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'ACCEPT' => 'application/json' } }

  before do
    create(:company_member, company: company, user: user, role: 'owner', status: 'active')
  end

  def with_png
    Tempfile.create(['service-cover-', '.png']) do |temp|
      temp.binmode
      temp.write(Base64.decode64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/vZsAAAAASUVORK5CYII='))
      temp.flush
      yield Rack::Test::UploadedFile.new(temp.path, 'image/png')
    end
  end

  it 'creates a service with cover and gallery and exposes both on the public API' do
    with_png do |cover|
      with_png do |gallery|
        post '/api/v1/dashboard/services', params: {
          service: {
            name: 'Armazenamento de Energia',
            category_id: category.id,
            status: 'active',
            description: 'Projeto e instalação de sistemas de armazenamento.',
            cover_image: cover,
            images: [gallery]
          }
        }, headers: headers

        expect(response).to have_http_status(:created)
        service = CompanyService.find_by!(company: company, slug: 'armazenamento-de-energia')
        expect(service.cover_image).to be_attached
        expect(service.images.count).to eq(1)
        expect(JSON.parse(response.body).dig('service', 'images').length).to eq(1)

        get "/api/v1/companies/#{company.id}/services/#{service.slug}"
        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body).fetch('data')
        expect(payload['image_url']).to be_present
        expect(payload['cover_image_url']).to be_present
        expect(payload['images'].length).to eq(1)
        expect(payload['company_id']).to eq(company.id)
      end
    end
  end

  it 'appends new images without replacing existing ones and removes only its own attachments' do
    service = CompanyService.create!(company: company, category: category, name: 'Manutenção', slug: 'manutencao', status: 'active')

    with_png do |first|
      patch "/api/v1/dashboard/services/#{service.id}", params: { service: { images: [first] } }, headers: headers
      expect(response).to have_http_status(:ok)
    end
    original_attachment_id = service.reload.images_attachments.first.id

    with_png do |second|
      patch "/api/v1/dashboard/services/#{service.id}", params: { service: { images: [second] } }, headers: headers
      expect(response).to have_http_status(:ok)
    end
    expect(service.reload.images.count).to eq(2)

    patch "/api/v1/dashboard/services/#{service.id}", params: {
      service: { remove_image_ids: [original_attachment_id] }
    }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(service.reload.images.count).to eq(1)
    expect(service.images_attachments.pluck(:id)).not_to include(original_attachment_id)
  end

  it 'rejects uploaded media with an unsupported MIME type' do
    Tempfile.create(['not-an-image-', '.txt']) do |temp|
      temp.write('not an image')
      temp.flush
      post '/api/v1/dashboard/services', params: {
        service: {
          name: 'Serviço inválido',
          category_id: category.id,
          images: [Rack::Test::UploadedFile.new(temp.path, 'text/plain')]
        }
      }, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['code']).to eq('INVALID_SERVICE_MEDIA')
      expect(CompanyService.where(company: company, name: 'Serviço inválido')).to be_empty
    end
  end

  it 'does not disclose inactive services on the public detail endpoint' do
    service = CompanyService.create!(
      company: company, category: category, name: 'Rascunho', slug: 'rascunho', status: 'inactive'
    )
    get "/api/v1/companies/#{company.id}/services/#{service.slug}"
    expect(response).to have_http_status(:not_found)
  end
end
