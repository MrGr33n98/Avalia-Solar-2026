require 'rails_helper'

RSpec.describe Sales::TrackingIdentityMerger do
  it 'expõe merge de sessão anônima em contato conhecido' do
    expect(described_class).to respond_to(:call)
  end
end
