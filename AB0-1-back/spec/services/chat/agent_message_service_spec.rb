# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::AgentMessageService do
  let(:company) { create(:company) }
  let(:agent) { create(:user, role: 'company', company: nil, approved_by_admin: true) }
  let(:session) { create(:chat_session, company: company, mode: 'hybrid', inbox_status: 'waiting_agent') }

  before do
    allow(Chat::InboxBroadcastService).to receive(:message_created)
    allow(Chat::InboxBroadcastService).to receive(:session_updated)
  end

  it 'persists the reply and pauses the bot' do
    message = described_class.call(session: session, agent: agent, content: 'Posso ajudar?', client_message_id: 'one')

    expect(message).to have_attributes(role: 'agent', sender_id: agent.id, content: 'Posso ajudar?')
    expect(session.reload).to have_attributes(mode: 'human_manual', inbox_status: 'in_progress')
  end

  it 'reuses a message with the same client id' do
    first = described_class.call(session: session, agent: agent, content: 'Olá', client_message_id: 'same')
    second = described_class.call(session: session, agent: agent, content: 'Olá', client_message_id: 'same')

    expect(second.id).to eq(first.id)
  end
end
