# frozen_string_literal: true

require 'rails_helper'

RSpec.describe VoiceReviews::PurgeExpiredAssetsJob, type: :job do
  let(:company) { create(:company) }
  let(:actor) { create(:user, company: company) }
  let(:form) { ReviewForm.create!(company: company, name: 'Geral', public_title: 'Avalie', form_type: 'general') }
  let(:invite) do
    VoiceReviews::InviteService.call(
      company: company, review_form: form, actor: actor,
      kind: 'reusable_qr', idempotency_key: 'purge-expired-test-20261115'
    )
  end

  it 'expires active sessions past expires_at but preserves submitted and abandoned states (RCA-007)' do
    submitted_session = VoiceReviews::SessionService.open!(
      invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_chat_id: '5511911111111@c.us', provider_contact: '5511911111111@c.us',
      provider_message_id: 'msg-1'
    )
    submitted_session.update!(state: 'submitted', expires_at: 2.days.ago)

    abandoned_session = VoiceReviews::SessionService.open!(
      invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_chat_id: '5511922222222@c.us', provider_contact: '5511922222222@c.us',
      provider_message_id: 'msg-2'
    )
    abandoned_session.update!(state: 'abandoned', expires_at: 2.days.ago)

    active_stale_session = VoiceReviews::SessionService.open!(
      invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_chat_id: '5511933333333@c.us', provider_contact: '5511933333333@c.us',
      provider_message_id: 'msg-3'
    )
    active_stale_session.update!(state: 'awaiting_consent', expires_at: 2.days.ago)

    described_class.perform_now(Time.current)

    expect(submitted_session.reload.state).to eq('submitted')
    expect(abandoned_session.reload.state).to eq('abandoned')
    expect(active_stale_session.reload.state).to eq('expired')
  end
end
