require 'rails_helper'

RSpec.describe Groups::Feature do
  around do |example|
    original = ENV['GROUPS_ENABLED']
    example.run
    ENV['GROUPS_ENABLED'] = original
  end

  it 'permanece desabilitada quando ENV está ausente' do
    ENV.delete('GROUPS_ENABLED')

    expect(described_class.enabled?).to be(false)
  end

  it 'aceita somente o valor booleano configurado' do
    ENV['GROUPS_ENABLED'] = 'true'
    expect(described_class.enabled?).to be(true)

    ENV['GROUPS_ENABLED'] = 'false'
    expect(described_class.enabled?).to be(false)
  end
end