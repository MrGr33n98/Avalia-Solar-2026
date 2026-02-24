require 'rails_helper'

RSpec.describe 'Company sector questions API', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json' } }
  let(:free_plan) { create(:plan, price: 0, features: nil) }
  let(:paid_plan) { create(:plan, price: 199, features: { sector_question_limit: 3 }.to_json) }

  let(:company) do
    create(
      :company,
      plan: free_plan,
      status: 'pending',
      moderation_status: 'approved',
      sector_ratings_enabled: true,
      state: 'SP',
      city: 'Sao Paulo'
    )
  end

  let(:user) do
    create(
      :user,
      role: 'company',
      status: :active,
      approved_by_admin: true,
      company: nil,
      confirmed_at: Time.current,
      city: 'Sao Paulo',
      state: 'SP'
    )
  end

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanySectorQuestionsController).to receive(:current_user).and_return(user)
  end

  def create_question(prompt)
    next_order = company.company_sector_questions.count + 1
    post '/api/v1/company_dashboard/sector_questions',
         params: {
           company_id: company.id,
           company_sector_question: {
             prompt: prompt,
              weight: 1,
              order: next_order,
              enabled: true,
            },
          }.to_json,
         headers: headers
  end

  describe 'POST /api/v1/company_dashboard/sector_questions' do
    it 'allows up to free limit and blocks the next question for free plan' do
      create_question('Pergunta 1')
      expect(response).to have_http_status(:created)

      create_question('Pergunta 2')
      expect(response).to have_http_status(:created)

      create_question('Pergunta 3')
      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('PLAN_REQUIRED')
    end

    it 'enforces paid plan hard limit when configured' do
      company.update!(plan: paid_plan)

      create_question('Pergunta 1')
      expect(response).to have_http_status(:created)
      create_question('Pergunta 2')
      expect(response).to have_http_status(:created)
      create_question('Pergunta 3')
      expect(response).to have_http_status(:created)

      create_question('Pergunta 4')
      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('SECTOR_QUESTION_LIMIT_REACHED')
    end
  end
end
