require 'rails_helper'

RSpec.describe Conversation, type: :model do
  subject(:conversation) { build(:conversation) }

  it { is_expected.to belong_to(:user) }
  it { is_expected.to belong_to(:company) }
  it { is_expected.to have_many(:direct_messages).dependent(:destroy) }
  it { is_expected.to have_many(:conversation_events).dependent(:destroy) }
  it { is_expected.to have_many(:conversation_reports).dependent(:destroy) }

  it 'prevents duplicate conversations for the same buyer and company' do
    existing = create(:conversation)
    duplicate = build(:conversation, user: existing.user, company: existing.company)

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:user_id]).to be_present
  end

  it 'increments company unread count when a buyer sends a message' do
    conversation = create(:conversation)
    message = create(:direct_message, conversation: conversation, sender_type: 'User')

    conversation.register_message!(message, actor: conversation.user)

    expect(conversation.reload.company_unread_count).to eq(1)
    expect(conversation.status).to eq('pending_company')
    expect(conversation.sla_due_at).to be_present
  end

  it 'marks unread messages as read for the company side' do
    conversation = create(:conversation, company_unread_count: 1)
    company_user = create(:user, role: 'company')
    create(:company_member, company: conversation.company, user: company_user, status: 'active')
    message = create(:direct_message, conversation: conversation, sender_type: 'User', read_at: nil)

    read_ids = conversation.mark_read_for!(company_user)

    expect(read_ids).to include(message.id)
    expect(message.reload.read_at).to be_present
    expect(conversation.reload.company_unread_count).to eq(0)
  end
end
