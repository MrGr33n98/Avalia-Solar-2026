require 'rails_helper'

RSpec.describe VoiceReviews::SessionService, type: :service do
  let(:company) { create(:company) }
  let(:actor) { create(:user, company: company) }
  let(:form) { ReviewForm.create!(company: company, name: 'Geral', public_title: 'Avalie', form_type: 'general') }
  let(:invite) do
    VoiceReviews::InviteService.call(
      company: company, review_form: form, actor: actor,
      kind: 'reusable_qr', idempotency_key: 'voice-session-idempotency-20261109'
    )
  end

  it 'never resets a submitted session when an invite is replayed' do
    first = described_class.open!(invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
                                  provider_chat_id: '5511999999999@c.us', provider_contact: '5511999999999@c.us',
                                  provider_message_id: 'message-one')
    first.update!(state: 'submitted', version: 10)
    second = described_class.open!(invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
                                   provider_chat_id: '5511999999999@c.us', provider_contact: '5511999999999@c.us',
                                   provider_message_id: 'message-two')
    expect(second.id).to eq(first.id)
    expect(second.reload.state).to eq('submitted')
    expect(second.version).to eq(10)
  end
end
