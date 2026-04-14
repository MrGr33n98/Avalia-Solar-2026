require 'rails_helper'

RSpec.describe 'OmniAuth routing', type: :routing do
  it 'routes the google oauth entrypoint to Devise' do
    expect(get: '/users/auth/google_oauth2').to route_to(
      controller: 'users/omniauth_callbacks',
      action: 'passthru',
      provider: 'google_oauth2'
    )
  end
end
