require 'rails_helper'

RSpec.describe 'Social proof APIs', type: :request do
  let!(:paid_plan) { create(:plan, price: 199.9, features: { social_proof: true }.to_json) }
  let!(:free_plan) { create(:plan, price: 0, features: { social_proof: false }.to_json) }

  let!(:paid_company) do
    create(
      :company,
      plan: paid_plan,
      social_proof_enabled: true
    )
  end

  let!(:free_company) do
    create(
      :company,
      plan: free_plan,
      social_proof_enabled: true
    )
  end

  let!(:paid_company_user) do
    create(
      :user,
      role: 'company',
      status: :active,
      company: nil,
      confirmed_at: Time.current
    )
  end

  let!(:free_company_user) do
    create(
      :user,
      role: 'company',
      status: :active,
      company: nil,
      confirmed_at: Time.current
    )
  end

  before do
    create(:company_member, company: paid_company, user: paid_company_user, role: :owner, status: 'active')
    create(:company_member, company: free_company, user: free_company_user, role: :owner, status: 'active')
    allow(SlackNotificationService).to receive(:notify_review)
    allow(Analytics::TrackEventService).to receive(:call)
  end

  def create_reviewer(email)
    create(
      :user,
      email: email,
      role: 'review',
      status: :active,
      company: nil,
      city: 'Sao Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  describe 'GET /api/v1/companies/:id/social_proof' do
    it 'returns only approved featured reviews for public output' do
      featured_review = create(
        :review,
        company: paid_company,
        user: create_reviewer('featured@example.com'),
        status: :approved,
        featured: true,
        display_order: 1
      )

      create(
        :review,
        company: paid_company,
        user: create_reviewer('approved-not-featured@example.com'),
        status: :approved,
        featured: false
      )

      create(
        :review,
        company: paid_company,
        user: create_reviewer('pending@example.com'),
        status: :pending,
        featured: false
      )

      get "/api/v1/companies/#{paid_company.id}/social_proof"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body['reviews']).to be_an(Array)
      expect(body['reviews'].size).to eq(1)
      expect(body['reviews'].first['id']).to eq(featured_review.id)
      expect(body['reviews'].first['status']).to eq('approved')
      expect(body['reviews'].first['featured']).to eq(true)
    end

    it 'returns an empty payload when the company plan is not eligible' do
      create(
        :review,
        company: free_company,
        user: create_reviewer('free-public@example.com'),
        status: :approved,
        featured: true,
        display_order: 1
      )

      get "/api/v1/companies/#{free_company.id}/social_proof"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body['company_id']).to eq(free_company.id)
      expect(body['total_featured_reviews']).to eq(0)
      expect(body['reviews']).to eq([])
    end
  end

  describe 'PATCH /api/v1/company_dashboard/social_proof_reviews/:id' do
    it 'blocks featuring reviews for companies without eligible paid plans' do
      allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(free_company_user)

      review = create(
        :review,
        company: free_company,
        user: create_reviewer('free-company-review@example.com'),
        status: :approved,
        featured: false
      )

      patch "/api/v1/company_dashboard/social_proof_reviews/#{review.id}",
            params: { review: { featured: true } }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
