require "rails_helper"

RSpec.describe "Sales API Authorization", type: :request do
  let(:admin_user) { create(:user, role: :admin, company: nil) }
  let(:company_user) { create(:user, role: :company) }
  let(:review_user) { create(:user, role: :review) }

  def generate_jwt(user)
    payload = { user_id: user.id, typ: 'access', exp: 1.day.from_now.to_i }
    JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
  end

  describe "GET /api/v1/sales/accounts" do
    context "when anonymous" do
      it "returns 401 Unauthorized" do
        get "/api/v1/sales/accounts"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when marketplace (review) user" do
      it "returns 403 Forbidden" do
        headers = { "Authorization" => "Bearer #{generate_jwt(review_user)}" }
        get "/api/v1/sales/accounts", headers: headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when company user" do
      it "returns 403 Forbidden" do
        headers = { "Authorization" => "Bearer #{generate_jwt(company_user)}" }
        get "/api/v1/sales/accounts", headers: headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when admin/internal user" do
      it "returns 200 OK" do
        headers = { "Authorization" => "Bearer #{generate_jwt(admin_user)}" }
        get "/api/v1/sales/accounts", headers: headers
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
