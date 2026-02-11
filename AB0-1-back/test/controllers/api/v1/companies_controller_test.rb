require 'test_helper'

module Api
  module V1
    class CompaniesControllerTest < ActionDispatch::IntegrationTest
      setup do
        @company = ::Company.create!(
          name: 'Empresa WEG Teste',
          description: 'Descricao de teste para analytics',
          status: 'pending'
        )
        @company.update_column(:status, 'active')

        @member_user = create_company_user('member-dashboard@test.com')
        ::CompanyMember.create!(company: @company, user: @member_user, role: 'manager', status: 'active')

        @outsider_user = create_company_user('outsider-dashboard@test.com')
      end

      test 'analytics_historical allows company user with active membership even when company_id is nil' do
        assert_nil @member_user.company_id

        get "/api/v1/companies/#{@company.id}/analytics/historical",
            headers: auth_headers(@member_user),
            as: :json

        assert_response :success
        payload = JSON.parse(response.body)
        assert payload.key?('data')
      end

      test 'analytics_historical forbids company user without active membership' do
        get "/api/v1/companies/#{@company.id}/analytics/historical",
            headers: auth_headers(@outsider_user),
            as: :json

        assert_response :forbidden
      end

      private

      def create_company_user(email)
        ::User.create!(
          email: email,
          password: 'Aa123456',
          password_confirmation: 'Aa123456',
          name: 'Dashboard Company User',
          role: 'company',
          status: :active,
          terms_accepted: true,
          terms_accepted_at: Time.current,
          confirmed_at: Time.current
        )
      end

      def auth_headers(user)
        token = JWT.encode(
          { user_id: user.id, exp: 24.hours.from_now.to_i },
          Rails.application.secret_key_base,
          'HS256'
        )

        {
          'Authorization' => "Bearer #{token}",
          'Content-Type' => 'application/json'
        }
      end
    end
  end
end
