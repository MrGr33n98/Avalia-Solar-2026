require 'rails_helper'

RSpec.describe Chat::SessionAccessToken, type: :service do
  let(:session) { create(:chat_session) }

  it 'gera e valida token vinculado à sessão' do
    token = described_class.generate(session)
    payload = described_class.verify(token, session: session)

    expect(payload[:session_id]).to eq(session.id)
  end

  it 'rejeita token de outra sessão' do
    token = described_class.generate(session)
    other = create(:chat_session)

    expect { described_class.verify(token, session: other) }
      .to raise_error(described_class::InvalidToken)
  end
end
