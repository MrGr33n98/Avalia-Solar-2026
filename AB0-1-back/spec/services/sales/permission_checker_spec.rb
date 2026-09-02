require 'rails_helper'

RSpec.describe Sales::PermissionChecker do
  it 'expõe verificação granular de permissão' do
    expect(described_class).to respond_to(:allowed?)
  end
end
