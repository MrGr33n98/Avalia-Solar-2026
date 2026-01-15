require 'rails_helper'

RSpec.describe 'Api::V1::Company::Members', type: :request do
  let(:company) { create(:company) }
  let(:owner_user) { create(:user, company: company, role: 'company') }
  let!(:owner_member) { create(:company_member, company: company, user: owner_user, role: :owner) }
  
  describe 'GET /api/v1/company/members' do
    before do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)
    end

    let!(:manager) { create(:company_member, company: company, role: :manager) }
    let!(:editor) { create(:company_member, company: company, role: :editor) }
    
    it 'returns paginated list of members' do
      get '/api/v1/company/members'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      # owner + manager + editor = 3
      expect(json['items'].size).to eq(3)
      expect(json['meta']['total_count']).to eq(3)
    end

    it 'filters by role' do
      get '/api/v1/company/members', params: { role: 'editor' }
      
      json = JSON.parse(response.body)
      expect(json['items'].size).to eq(1)
      expect(json['items'][0]['role']).to eq('editor')
    end

    it 'paginates results' do
      create_list(:company_member, 25, company: company, role: :editor)
      
      get '/api/v1/company/members', params: { page: 2, per_page: 10 }
      
      json = JSON.parse(response.body)
      expect(json['items'].size).to eq(10)
      expect(json['meta']['current_page']).to eq(2)
    end
  end

  describe 'GET /api/v1/company/members/:id' do
    before do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)
    end

    let!(:target_member) { create(:company_member, company: company, role: :manager) }

    it 'returns member details with permissions' do
      get "/api/v1/company/members/#{target_member.id}"
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json['id']).to eq(target_member.id)
      expect(json['role']).to eq('manager')
      expect(json['permissions']).to include('manage_members')
      expect(json['user']['email']).to be_present
    end
  end
end
