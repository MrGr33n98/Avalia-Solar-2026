# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API root', type: :request do
  it 'returns a minimal service response without exposing framework versions' do
    get '/'

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq(
      'service' => 'Avalia Solar API',
      'status' => 'ok'
    )
    expect(response.headers['X-Robots-Tag']).to eq('noindex, nofollow, noarchive')
    expect(response.body).not_to include('Ruby on Rails')
  end
end
