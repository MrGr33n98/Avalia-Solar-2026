require 'rails_helper'

RSpec.describe Sales::LgpdDataRequest do
  it 'expõe operação de anonimização como serviço explícito' do
    expect(described_class).to respond_to(:anonymize_contact!)
  end
end
