# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Dashboard SEO metadata', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
  end

  describe 'POST /api/v1/company_dashboard/update_info' do
    it 'updates SEO metadata directly from company dashboard payloads' do
      payload = {
        company: {
          seo_title: 'Solar Pro em Cuiaba | Avalia Solar',
          seo_description: 'Empresa especializada em energia solar em Cuiaba com projetos residenciais e comerciais.',
          seo_keywords: 'energia solar, Cuiaba, instalador solar'
        }
      }

      post '/api/v1/company_dashboard/update_info', params: payload

      expect(response).to have_http_status(:created)
      expect(company.reload).to have_attributes(
        seo_title: payload[:company][:seo_title],
        seo_description: payload[:company][:seo_description],
        meta_description: payload[:company][:seo_description],
        seo_keywords: payload[:company][:seo_keywords]
      )

      pending_change = company.pending_changes.pending.last
      expect(pending_change.data['attributes']).to include(
        'seo_title' => payload[:company][:seo_title],
        'seo_description' => payload[:company][:seo_description],
        'seo_keywords' => payload[:company][:seo_keywords]
      )
    end
  end

  describe 'GET /api/v1/companies/:id' do
    let(:public_company) do
      create(
        :company,
        status: :active,
        active_admin: false,
        seo_title: 'Solar Pro em Cuiaba | Avalia Solar',
        seo_description: 'Instaladora solar com atendimento residencial e comercial em Cuiaba.',
        seo_keywords: 'energia solar, Cuiaba, instalador solar'
      )
    end

    it 'returns SEO metadata fields for frontend metadata generation' do
      get "/api/v1/companies/#{public_company.id}"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body).fetch('company')
      expect(payload).to include(
        'seo_title' => public_company.seo_title,
        'seo_description' => public_company.seo_description,
        'meta_description' => public_company.seo_description,
        'seo_keywords' => public_company.seo_keywords
      )
    end
  end
end
