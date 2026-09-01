require 'rails_helper'

RSpec.describe 'Sales CRM API', type: :request do
  let(:user) { create(:user, role: 'review', status: :active) }

  it 'bloqueia usuário que não é sales admin' do
    allow_any_instance_of(Api::V1::SalesController).to receive(:current_user).and_return(user)

    get '/api/v1/sales/summary'

    expect(response).to have_http_status(:forbidden)
  end
end
