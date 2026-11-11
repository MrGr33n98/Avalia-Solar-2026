require 'rails_helper'

RSpec.describe "Api::V1::FinancialInstitutions", type: :request do
  let!(:institution) do
    FinancialInstitution.create!(
      name: 'Banco Solar',
      active: true,
      display_order: 1
    )
  end

  describe "GET /api/v1/financial_institutions" do
    it "returns http success" do
      get "/api/v1/financial_institutions"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /api/v1/financial_institutions/:id" do
    it "returns http success" do
      get "/api/v1/financial_institutions/#{institution.slug}"
      expect(response).to have_http_status(:success)
    end
  end
end
