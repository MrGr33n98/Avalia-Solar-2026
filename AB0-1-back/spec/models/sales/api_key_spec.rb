require 'rails_helper'

RSpec.describe Sales::ApiKey do
  it 'armazena somente digest e autentica chave ativa' do
    user = create(:user)
    key, raw = described_class.issue!(user: user, name: 'integração', scopes: %w[quotes:read])

    expect(key.key_digest).not_to include(raw)
    expect(described_class.authenticate(raw)).to eq(key)

    key.update!(revoked_at: Time.current)
    expect(described_class.authenticate(raw)).to be_nil
  end
end
