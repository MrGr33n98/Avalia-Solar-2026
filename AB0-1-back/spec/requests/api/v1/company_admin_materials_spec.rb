require 'rails_helper'

RSpec.describe 'Company admin materials API', type: :request do
  let(:user) { create(:user, status: :active, role: :company, confirmed_at: Time.current) }
  let(:company) { create(:company, status: :active) }
  let(:headers) do
    post '/api/v1/auth/login', params: { email: user.email, password: 'Password123' }.to_json, headers: { 'Content-Type' => 'application/json' }
    { 'Authorization' => "Bearer #{JSON.parse(response.body)['token']}" }
  end

  before do
    create(:company_member, user: user, company: company, role: 'owner')
    allow_any_instance_of(Company).to receive(:feature_enabled?).with('downloadable_materials').and_return(true)
    allow_any_instance_of(Company).to receive(:feature_enabled_from_plan?).with('auto_publish_materials', include_defaults: false).and_return(true)
  end

  describe 'GET /api/v1/company_admin/materials' do
    it 'retorna materiais da empresa e configuração de publicação automática' do
      material = create(:company_material, company: company, title: 'Catálogo Premium')

      get '/api/v1/company_admin/materials', params: { company_id: company.id }, headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['materials'].map { |item| item['id'] }).to include(material.id)
      expect(body['auto_publish']).to be(true)
    end

    it 'não expõe material de outra empresa' do
      create(:company_material, company: company, title: 'Material próprio')
      create(:company_material, title: 'Material externo')

      get '/api/v1/company_admin/materials', params: { company_id: company.id }, headers: headers

      expect(JSON.parse(response.body)['materials'].map { |item| item['title'] }).to eq(['Material próprio'])
    end
  end
end
