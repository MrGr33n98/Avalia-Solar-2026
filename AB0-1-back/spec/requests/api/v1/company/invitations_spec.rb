require 'rails_helper'

RSpec.describe 'Api::V1::Company::Invitations', type: :request do
  include ActiveJob::TestHelper

  let(:company) { create(:company) }
  let(:owner_user) { create(:user, company: company, role: 'company') }
  let!(:owner_member) { create(:company_member, company: company, user: owner_user, role: :owner, status: 'active') }

  let(:editor_user) { create(:user, company: company, role: 'company') }
  let!(:editor_member) { create(:company_member, company: company, user: editor_user, role: :editor, status: 'active') }

  let(:invitee_user) { create(:user, email: 'convidado@teste.com', role: 'review') }

  describe 'GET /api/v1/company/invitations' do
    let!(:invitation) do
      inv = company.company_invitations.new(
        invited_by: owner_user,
        email: 'convidado@empresa.com',
        role: 'editor'
      )
      inv.generate_token!
      inv.save!
      inv
    end

    it 'allows owner to list pending invitations' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      get '/api/v1/company/invitations'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['items'].size).to eq(1)
      expect(json['items'].first['email']).to eq('convidado@empresa.com')
      expect(json['items'].first['role']).to eq('editor')
    end

    it 'denies editor from listing invitations' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(editor_user)

      get '/api/v1/company/invitations'
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'POST /api/v1/company/invitations' do
    it 'creates invitation and enqueues mailer' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      expect do
        post '/api/v1/company/invitations', params: { email: 'novoengenheiro@solar.com', role: 'manager' }
      end.to change(CompanyInvitation, :count).by(1)
         .and have_enqueued_mail(CompanyInvitationMailer, :invite_email)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['email']).to eq('novoengenheiro@solar.com')
      expect(json['role']).to eq('manager')
    end

    it 'denies editor from creating invitations' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(editor_user)

      post '/api/v1/company/invitations', params: { email: 'novoengenheiro@solar.com', role: 'editor' }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'DELETE /api/v1/company/invitations/:id' do
    let!(:invitation) do
      inv = company.company_invitations.new(
        invited_by: owner_user,
        email: 'revogar@empresa.com',
        role: 'editor'
      )
      inv.generate_token!
      inv.save!
      inv
    end

    it 'revokes pending invitation' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(owner_user)

      delete "/api/v1/company/invitations/#{invitation.id}"

      expect(response).to have_http_status(:no_content)
      expect(invitation.reload.status).to eq('revoked')
    end
  end

  describe 'Public invitation verify and accept flow' do
    let(:raw_token) { 'secure_test_token_1234567890123456' }
    let!(:invitation) do
      inv = company.company_invitations.new(
        invited_by: owner_user,
        email: invitee_user.email,
        role: 'editor',
        token_digest: CompanyInvitation.digest(raw_token),
        expires_at: 7.days.from_now,
        status: 'pending'
      )
      inv.save!
      inv
    end

    it 'verifies valid invitation token via POST body' do
      post '/api/v1/company_invitations/verify', params: { token: raw_token }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['company_name']).to eq(company.name)
      expect(json['email']).to eq(invitee_user.email)
    end

    it 'verifies valid invitation token via X-Invitation-Token header' do
      get '/api/v1/company_invitations/verify', headers: { 'X-Invitation-Token' => raw_token }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['company_name']).to eq(company.name)
    end

    it 'returns 404 for invalid token' do
      post '/api/v1/company_invitations/verify', params: { token: 'invalid_token' }
      expect(response).to have_http_status(:not_found)
    end

    it 'accepts invitation for authenticated user' do
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(invitee_user)

      post '/api/v1/company_invitations/accept', params: { token: raw_token }

      expect(response).to have_http_status(:ok)
      expect(invitation.reload.status).to eq('accepted')
      expect(company.company_members.active.where(user_id: invitee_user.id, role: :editor).exists?).to be true
    end
  end
end
