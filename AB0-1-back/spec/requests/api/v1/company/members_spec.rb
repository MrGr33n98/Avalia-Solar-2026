require 'rails_helper'

RSpec.describe 'Api::V1::Company::Members', type: :request do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }

  let(:owner_user) { create(:user, company: company, role: 'company') }
  let!(:owner_member) { create(:company_member, company: company, user: owner_user, role: :owner, status: 'active') }

  let(:editor_user) { create(:user, company: company, role: 'company') }
  let!(:editor_member) { create(:company_member, company: company, user: editor_user, role: :editor, status: 'active') }

  let(:revoked_owner_user) { create(:user, company: company, role: 'company') }
  let!(:revoked_owner_member) { create(:company_member, company: company, user: revoked_owner_user, role: :owner, status: 'revoked') }

  describe 'GET /api/v1/company/members' do
    before do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)
    end

    let!(:manager) { create(:company_member, company: company, role: :manager, status: 'active') }
    let!(:other_company_member) { create(:company_member, company: other_company, role: :editor, status: 'active') }

    it 'returns paginated list of members for current company' do
      get '/api/v1/company/members'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      ids = json['items'].map { |m| m['id'] }
      expect(ids).to include(owner_member.id, editor_member.id, manager.id)
      expect(ids).not_to include(other_company_member.id)
    end

    it 'filters by role' do
      get '/api/v1/company/members', params: { role: 'editor' }

      json = JSON.parse(response.body)
      expect(json['items'].all? { |m| m['role'] == 'editor' }).to be true
      expect(json['items'].map { |m| m['id'] }).to include(editor_member.id)
    end

    it 'paginates results' do
      create_list(:company_member, 25, company: company, role: :editor, status: 'active')

      get '/api/v1/company/members', params: { page: 2, per_page: 10 }

      json = JSON.parse(response.body)
      expect(json['items'].size).to eq(10)
      expect(json['meta']['current_page']).to eq(2)
    end

    it 'resolves target company via X-Company-Id header if active member' do
      # Make owner_user also active member of other_company
      create(:company_member, company: other_company, user: owner_user, role: :owner, status: 'active')

      get '/api/v1/company/members', headers: { 'X-Company-Id' => other_company.id.to_s }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      ids = json['items'].map { |m| m['id'] }
      expect(ids).to include(other_company_member.id)
      expect(ids).not_to include(owner_member.id)
    end
  end

  describe 'GET /api/v1/company/members/:id' do
    before do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)
    end

    let!(:target_member) { create(:company_member, company: company, role: :manager, status: 'active') }
    let!(:foreign_member) { create(:company_member, company: other_company, role: :editor, status: 'active') }

    it 'returns member details with permissions' do
      get "/api/v1/company/members/#{target_member.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json['id']).to eq(target_member.id)
      expect(json['role']).to eq('manager')
      expect(json['permissions']).to include('manage_members')
      expect(json['user']['email']).to be_present
    end

    it 'returns 404 for member of another company' do
      get "/api/v1/company/members/#{foreign_member.id}"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/company/members/invite' do
    it 'allows active owner to invite a member' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      post '/api/v1/company/members/invite', params: { email: 'novomembro@teste.com', role: 'editor' }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['role']).to eq('editor')
      expect(json['user']['email']).to eq('novomembro@teste.com')
    end

    it 'denies invitation by editor' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(editor_user)

      post '/api/v1/company/members/invite', params: { email: 'tentativa@teste.com', role: 'editor' }

      expect(response).to have_http_status(:forbidden)
    end

    it 'denies invitation by revoked owner' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(revoked_owner_user)

      post '/api/v1/company/members/invite', params: { email: 'tentativa@teste.com', role: 'editor' }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'PATCH /api/v1/company/members/:id' do
    let!(:target_member) { create(:company_member, company: company, role: :editor, status: 'active') }

    it 'allows active owner to update member role' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      patch "/api/v1/company/members/#{target_member.id}", params: { role: 'manager' }

      expect(response).to have_http_status(:ok)
      expect(target_member.reload.role).to eq('manager')
    end

    it 'denies update by editor' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(editor_user)

      patch "/api/v1/company/members/#{target_member.id}", params: { role: 'manager' }

      expect(response).to have_http_status(:forbidden)
    end

    it 'prevents demoting the only active owner of the company' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      patch "/api/v1/company/members/#{owner_member.id}", params: { role: 'editor' }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(owner_member.reload.role).to eq('owner')
    end
  end

  describe 'DELETE /api/v1/company/members/:id' do
    let!(:target_member) { create(:company_member, company: company, role: :editor, status: 'active') }

    it 'allows active owner to remove a non-owner member' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      delete "/api/v1/company/members/#{target_member.id}"

      expect(response).to have_http_status(:no_content)
      expect(CompanyMember.exists?(target_member.id)).to be false
    end

    it 'denies deletion by editor' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(editor_user)

      delete "/api/v1/company/members/#{target_member.id}"

      expect(response).to have_http_status(:forbidden)
    end

    it 'prevents deleting the only active owner' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      delete "/api/v1/company/members/#{owner_member.id}"

      expect(response).to have_http_status(:unprocessable_entity)
      expect(CompanyMember.exists?(owner_member.id)).to be true
    end

    it 'allows deleting an owner if another active owner exists' do
      second_owner_user = create(:user, company: company, role: 'company')
      second_owner = create(:company_member, company: company, user: second_owner_user, role: :owner, status: 'active')

      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      delete "/api/v1/company/members/#{second_owner.id}"

      expect(response).to have_http_status(:no_content)
      expect(CompanyMember.exists?(second_owner.id)).to be false
    end
  end

  describe 'Billing Authorization (BillingPolicy)' do
    it 'allows active owner to checkout' do
      policy = BillingPolicy.new(owner_user, company)
      expect(policy.checkout?).to be true
      expect(policy.portal?).to be true
    end

    it 'denies editor from checkout and portal' do
      policy = BillingPolicy.new(editor_user, company)
      expect(policy.checkout?).to be false
      expect(policy.portal?).to be false
    end

    it 'denies revoked owner from checkout' do
      policy = BillingPolicy.new(revoked_owner_user, company)
      expect(policy.checkout?).to be false
      expect(policy.portal?).to be false
    end
  end
end
