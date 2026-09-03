require 'rails_helper'

RSpec.describe Sales::EmailEvent do
  it 'mantém o vocabulário de eventos sincronizado com o job de envio' do
    expected = %w[queued sent delivered open click replied bounce complaint reject delivery_delay failed]
    expect(described_class::EVENT_TYPES).to match_array(expected)
  end

  it 'rejeita evento desconhecido' do
    event = described_class.new(event_type: 'provider_success', occurred_at: Time.current)
    expect(event).not_to be_valid
    expect(event.errors[:event_type]).to be_present
  end
end
