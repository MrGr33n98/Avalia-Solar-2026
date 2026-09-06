# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Campaigns', type: :request do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }
  let(:user_a) { create(:user, company: company_a) }
  let(:user_b) { create(:user, company: company_b) }
  let(:campaign_a) { create(:sales_campaign, company: company_a, user: user_a, status: 'draft') }
  let(:campaign_b) { create(:sales_campaign, company: company_b, user: user_b, status: 'draft') }

  let(:auth_headers_a) { { 'Authorization' => "Bearer #{user_a.generate_jwt}" } }

  describe 'PUT /api/v1/sales/campaigns/:id' do
    context 'when campaign is draft' do
      it 'allows updating audience and template' do
        new_template = create(:sales_email_template, company: company_a)
        put "/api/v1/sales/campaigns/#{campaign_a.id}", params: { campaign: { email_template_id: new_template.id } }, headers: auth_headers_a

        expect(response).to have_http_status(:ok)
        expect(campaign_a.reload.email_template_id).to eq(new_template.id)
      end
    end

    context 'when campaign is scheduled or dispatching' do
      it 'returns 409 Conflict on structural update when scheduled' do
        campaign_a.update!(status: 'scheduled', scheduled_at: 1.hour.from_now)
        put "/api/v1/sales/campaigns/#{campaign_a.id}", params: { campaign: { email_template_id: 999 } }, headers: auth_headers_a

        expect(response).to have_http_status(:conflict)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('CAMPAIGN_NOT_EDITABLE')
      end

      it 'returns 409 Conflict on structural update when dispatching' do
        campaign_a.update!(status: 'dispatching', started_at: Time.current)
        put "/api/v1/sales/campaigns/#{campaign_a.id}", params: { campaign: { audience_id: 123 } }, headers: auth_headers_a

        expect(response).to have_http_status(:conflict)
      end
    end
  end

  describe 'POST /api/v1/sales/campaigns/:id/schedule' do
    it 'schedules draft campaign for valid future date' do
      future_time = 2.hours.from_now.iso8601
      post "/api/v1/sales/campaigns/#{campaign_a.id}/schedule", params: { scheduled_at: future_time }, headers: auth_headers_a

      expect(response).to have_http_status(:ok)
      expect(campaign_a.reload.status).to eq('scheduled')
    end

    it 'returns 409 Conflict when attempting to schedule a dispatching campaign' do
      campaign_a.update!(status: 'dispatching', started_at: Time.current)
      post "/api/v1/sales/campaigns/#{campaign_a.id}/schedule", params: { scheduled_at: 2.hours.from_now.iso8601 }, headers: auth_headers_a

      expect(response).to have_http_status(:conflict)
    end
  end

  describe 'Authorization & Tenant Scope' do
    it 'prevents user of tenant A from accessing campaign of tenant B' do
      get "/api/v1/sales/campaigns/#{campaign_b.id}", headers: auth_headers_a
      expect(response).to have_http_status(:not_found)
    end
  end
end
