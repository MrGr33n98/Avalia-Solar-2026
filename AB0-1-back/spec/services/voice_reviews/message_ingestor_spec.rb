# frozen_string_literal: true

require 'rails_helper'

RSpec.describe VoiceReviews::MessageIngestor, type: :service do
  let(:company) { create(:company, name: 'Solar Master', cnpj: '11222333000181') }
  let(:actor) { create(:user, company: company) }
  let(:review_form) do
    ReviewForm.create!(company: company, name: 'Voz', public_title: 'Avalie', form_type: 'general', status: 'active',
                       settings: ReviewForm::DEFAULT_SETTINGS)
  end
  let(:invite) do
    VoiceReviews::InviteService.call(company: company, review_form: review_form, actor: actor, kind: 'reusable_qr',
                                     idempotency_key: 'message-ingestor-spec-1')
  end
  let(:gateway) { instance_double(VoiceReviews::ContinuationLink::FakeGateway) }
  let(:contact) { '5511977776666@c.us' }

  before do
    allow(VoiceReviews::ContinuationLink).to receive(:gateway).and_return(gateway)
    allow(gateway).to receive(:send_message)
  end

  it 'hashes chat_id in payload_minimal instead of storing plaintext phone (RCA-009)' do
    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      raw_body: '{}',
      messages: [
        {
          'id' => 'waha-msg-hash-1',
          'from' => contact,
          'chat_id' => contact,
          'type' => 'text',
          'text' => "AVS #{invite.public_code}"
        }
      ]
    )

    msg_record = VoiceReviewMessage.find_by!(provider_message_id: 'waha-msg-hash-1')
    expect(msg_record.payload_minimal).not_to have_key('chat_id')
    expect(msg_record.payload_minimal['chat_id_hash']).to be_present
    expect(msg_record.payload_minimal['chat_id_hash']).not_to include('5511977776666')
  end

  it 'does not reset current_criterion_index when user replies OK during criteria scoring (RCA-008)' do
    session = VoiceReviews::SessionService.open!(
      invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_chat_id: contact, provider_contact: contact, provider_message_id: 'msg-init'
    )
    VoiceReviewConsent.create!(
      voice_review_session: session, purpose: 'process_audio', granted: true,
      policy_version: VoiceReviews::Config.policy_version, granted_at: Time.current
    )
    session.update!(
      processing_consent_at: Time.current,
      draft_payload: { 'current_criterion_index' => 2, 'criterion_scores' => { 'atendimento' => 5, 'qualidade_tecnica' => 4 } }
    )

    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      raw_body: '{}',
      messages: [
        {
          'id' => 'waha-msg-ok-mid',
          'from' => contact,
          'chat_id' => contact,
          'type' => 'text',
          'text' => 'OK'
        }
      ]
    )

    expect(session.reload.draft_payload['current_criterion_index']).to eq(2)
  end

  it 'accepts express written review directly after consent without forcing 4 numeric replies (GAP-03)' do
    session = VoiceReviews::SessionService.open!(
      invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_chat_id: contact, provider_contact: contact, provider_message_id: 'msg-express-init'
    )
    VoiceReviewConsent.create!(
      voice_review_session: session, purpose: 'process_audio', granted: true,
      policy_version: VoiceReviews::Config.policy_version, granted_at: Time.current
    )
    session.update!(processing_consent_at: Time.current)

    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      raw_body: '{}',
      messages: [
        {
          'id' => 'waha-msg-express-text',
          'from' => contact,
          'chat_id' => contact,
          'type' => 'text',
          'text' => 'O atendimento da equipe foi excelente e a instalação com inversor WEG ficou pronta antes do prazo!'
        }
      ]
    )

    expect(session.reload.state).to eq('awaiting_confirmation')
    expect(session.latest_transcript).to be_present
  end

  it 'transitions active VoiceReviewSession to needs_human_review on AJUDA (FLOW-009)' do
    session = VoiceReviews::SessionService.open!(
      invite: invite, provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_chat_id: contact, provider_contact: contact, provider_message_id: 'msg-handoff-init'
    )

    expect(gateway).to receive(:send_message).with(session, /Atendimento Humano Solicitado/)

    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      raw_body: '{}',
      messages: [
        {
          'id' => 'waha-msg-handoff-1',
          'from' => contact,
          'chat_id' => contact,
          'type' => 'text',
          'text' => 'AJUDA'
        }
      ]
    )

    expect(session.reload.state).to eq('needs_human_review')
  end
end
