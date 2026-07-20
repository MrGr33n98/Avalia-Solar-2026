# frozen_string_literal: true

require 'rails_helper'

RSpec.describe P2pMessageNotificationJob, type: :job do
  let(:company) { create(:company, p2p_chat_enabled: true) }
  let(:buyer) { create(:user) }
  let(:conversation) { create(:conversation, company: company, user: buyer) }

  describe '#perform' do
    context 'when the message has not been read' do
      let!(:message) { create(:direct_message, conversation: conversation, sender_type: 'Company', body: 'Olá! Como podemos ajudar?', read_at: nil) }

      it 'creates an in-app notification for the recipient' do
        expect do
          described_class.new.perform(message.id)
        end.to change(Notification, :count).by(1)

        notification = Notification.last
        expect(notification.user_id).to eq(buyer.id)
        expect(notification.category).to eq('messages')
        expect(notification.title).to include(company.name)
      end
    end

    context 'when the message has already been read' do
      let!(:message) { create(:direct_message, conversation: conversation, sender_type: 'Company', body: 'Olá!', read_at: Time.current) }

      it 'does not create a notification' do
        expect do
          described_class.new.perform(message.id)
        end.not_to change(Notification, :count)
      end
    end
  end
end
