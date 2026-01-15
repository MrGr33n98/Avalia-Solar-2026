require "test_helper"

class CompanyMembersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @company = Company.create!(name: "Acme Corp", description: "Desc", status: "active")
    @owner = User.create!(email: "owner@example.com", password: "Aa123456", name: "Owner", role: "company", company: @company, terms_accepted: true, status: :active)
    CompanyMember.create!(company: @company, user: @owner, role: :owner)
    @token = JWT.encode({ user_id: @owner.id }, Rails.application.secret_key_base, "HS256")
    @headers = { "Authorization" => "Bearer #{@token}" }
  end

  test "index lists members" do
    get "/api/v1/company/members", headers: @headers
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["count"]
    assert_equal "owner", body["items"][0]["role"]
  end

  test "invite creates member" do
    post "/api/v1/company/members/invite", params: { email: "new@example.com", role: "editor" }, headers: @headers
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "editor", body["role"]
  end

  test "update changes role" do
    member = CompanyMember.create!(company: @company, user: @owner, role: :manager)
    patch "/api/v1/company/members/#{member.id}", params: { role: "editor" }, headers: @headers
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "editor", body["role"]
  end
end
