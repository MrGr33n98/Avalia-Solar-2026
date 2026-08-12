require 'rails_helper'

RSpec.describe 'Company Dashboard Policy Integration', type: :request do
  let(:user) { create(:user, status: :active, role: :company) }
  # Default free company
  let(:company) { create(:company, status: :active, cnpj: '12345678901234', address: 'Rua Antiga', city: 'Sampa', state: 'SP') }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    create(:company_member, user: user, company: company, role: 'owner')
  end

  describe 'POST /api/v1/company_dashboard/update_info' do
    context 'when editing allowed public/direct fields' do
      it 'applies changes directly and returns direct_update: true' do
        params = {
          company: {
            description: 'Nova descrição da empresa solar',
            working_hours: 'Seg-Sex 8h-18h',
            website: 'https://newsolarpower.com.br'
          }
        }

        post '/api/v1/company_dashboard/update_info', params: params, headers: headers

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(true)
        expect(body['message']).to match(/Alterações aplicadas com sucesso/i)

        company.reload
        expect(company.description).to eq('Nova descrição da empresa solar')
        expect(company.working_hours).to eq('Seg-Sex 8h-18h')
        expect(company.website).to eq('https://newsolarpower.com.br')
      end
    end

    context 'when editing restricted fields (e.g. cnpj)' do
      it 'creates a PendingChange, leaves company unchanged, and returns direct_update: false' do
        params = {
          company: {
            cnpj: '99999999999999'
          }
        }

        post '/api/v1/company_dashboard/update_info', params: params, headers: headers

        expect(response).to have_http_status(:created).or have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(false)
        expect(body['message']).to match(/Alterações enviadas para aprovação/i)
        expect(body['pending_change']).to be_present

        # Company field remains unchanged
        company.reload
        expect(company.cnpj).to eq('12345678901234')

        # Check pending change
        pc = company.pending_changes.last
        expect(pc.change_type).to eq('company_info')
        expect(pc.data['attributes']['cnpj']).to eq('99999999999999')
      end
    end

    context 'when editing a mix of direct and restricted fields' do
      it 'updates direct fields immediately, schedules restricted ones, and returns direct_update: false' do
        params = {
          company: {
            description: 'Descrição nova e misturada',
            cnpj: '99999999999999'
          }
        }

        post '/api/v1/company_dashboard/update_info', params: params, headers: headers

        expect(response).to have_http_status(:created).or have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(false)

        company.reload
        # Direct field updated
        expect(company.description).to eq('Descrição nova e misturada')
        # Restricted field unchanged
        expect(company.cnpj).to eq('12345678901234')

        # Scheduled field exists in pending change
        pc = company.pending_changes.last
        expect(pc.data['attributes']['cnpj']).to eq('99999999999999')
        expect(pc.data['attributes']['description']).to be_nil
      end
    end
    context 'when editing service area fields exceeding limits' do
      it 'denies direct update, creates PendingChange with limit_exceeded: true, and returns LIMIT_EXCEEDED reason' do
        params = {
          company: {
            coverage_states: ['SP', 'RJ', 'MG']
          }
        }

        post '/api/v1/company_dashboard/update_info', params: params, headers: headers

        expect(response).to have_http_status(:created).or have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(false)
        expect(body['limit_exceeded']).to eq(true)
        expect(body['reason_code']).to eq('LIMIT_EXCEEDED')

        # Check pending change metadata
        pc = company.pending_changes.last
        expect(pc.data['limit_exceeded']).to eq(true)
      end
    end
  end

  describe 'POST /api/v1/company_dashboard/add_categories' do
    context 'when category additions exceed plan limit' do
      it 'creates PendingChange, returns direct_update: false, limit_exceeded: true, and reason_code' do
        params = {
          category_ids: [101, 102, 103, 104] # 4 ids exceeds the free limit of 3
        }

        post '/api/v1/company_dashboard/add_categories', params: params, headers: headers

        expect(response).to have_http_status(:created).or have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(false)
        expect(body['limit_exceeded']).to eq(true)
        expect(body['reason_code']).to eq('LIMIT_EXCEEDED')

        # Check pending change data
        pc = company.pending_changes.last
        expect(pc.change_type).to eq('categories')
        expect(pc.data['limit_exceeded']).to eq(true)
      end
    end
  end

  describe 'POST /api/v1/company_dashboard/update_logo' do
    let(:logo_file) { fixture_file_upload(Rails.root.join('spec', 'fixtures', 'files', 'logo.png'), 'image/png') }

    context 'when company plan is enterprise (direct media update)' do
      before do
        allow_any_instance_of(Company).to receive(:inferred_plan_tier).and_return('enterprise')
      end

      it 'attaches logo directly and returns direct_update: true' do
        post '/api/v1/company_dashboard/update_logo', params: { file: logo_file }, headers: headers

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(true)
        expect(body['logo_url']).to be_present
        expect(company.reload.logo).to be_attached
      end
    end

    context 'when company plan is free (requires approval)' do
      before do
        allow_any_instance_of(Company).to receive(:inferred_plan_tier).and_return('free')
      end

      it 'creates a PendingChange and returns direct_update: false' do
        post '/api/v1/company_dashboard/update_logo', params: { file: logo_file }, headers: headers

        expect(response).to have_http_status(:created).or have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['direct_update']).to eq(false)
        expect(body['pending_change']).to be_present
        expect(company.reload.logo).not_to be_attached
      end
    end
  end
end
