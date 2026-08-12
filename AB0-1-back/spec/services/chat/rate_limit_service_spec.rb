# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::RateLimitService do
  let(:session) { create(:chat_session, message_count: 0) }

  it 'permite uma sessão dentro dos limites' do
    expect(described_class.check(session: session, ip: '127.0.0.1').allowed).to be(true)
  end

  it 'bloqueia a sessão ao atingir o limite de mensagens' do
    stub_const('ENV', ENV.to_h.merge('CHAT_MAX_MESSAGES_PER_SESSION' => '1'))
    session.update!(message_count: 1)
    expect(described_class.check(session: session, ip: '127.0.0.2').code).to eq('SESSION_MESSAGE_LIMIT')
  end
end
