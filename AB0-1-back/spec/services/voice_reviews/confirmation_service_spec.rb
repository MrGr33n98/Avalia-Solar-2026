require 'rails_helper'

RSpec.describe VoiceReviews::ConfirmationService, type: :service do
  let(:company) { create(:company) }
  let(:actor) { create(:user, company:) }
  let(:review_form) do
    ReviewForm.create!(company:, name: 'Voz', public_title: 'Avalie', form_type: 'general', status: 'active',
                       settings: ReviewForm::DEFAULT_SETTINGS)
  end
  let(:invite) do
    VoiceReviews::InviteService.call(company:, review_form:, actor:, kind: 'reusable_qr',
                                     idempotency_key: 'voice-confirm-idempotency-1')
  end
  let(:session) do
    opened = VoiceReviews::SessionService.open!(invite:, provider_contact: '5511999999999', provider_message_id: 'wamid.confirm')
    opened.update!(state: 'awaiting_confirmation')
    asset = opened.voice_review_assets.create!(provider_media_id: 'media-1', storage_key: 'private/1', sha256: 'hash',
                                               mime_type: 'audio/ogg', byte_size: 1)
    opened.voice_review_transcripts.create!(voice_review_asset: asset, provider: 'fake', model_id: 'fake-v1',
                                            language: 'pt-BR', private_raw_text: 'Texto original', version: 1)
    opened
  end

  it 'creates one pending canonical review only after explicit confirmation' do
    token = session.issue_new_token!
    params = { transcript_version: 1, review_text: 'Atendimento bom, prazo poderia melhorar.', rating: 2,
               experience_confirmed: true, publish_text_consent: true, display_name_mode: 'anonymous' }

    result = described_class.call(session:, token:, params:)

    expect(result[:review_status]).to eq('pending')
    expect(session.reload.published_review.capture_flow_source).to eq('whatsapp_voice')
    expect(session.published_review.rating).to eq(2)
    expect { described_class.call(session:, token:, params:) }.not_to change(Review, :count)
  end

  it 'does not infer a rating from the transcript' do
    token = session.issue_new_token!
    params = { transcript_version: 1, review_text: 'Atendimento excelente.', rating: nil,
               experience_confirmed: true, publish_text_consent: true, display_name_mode: 'anonymous' }

    expect { described_class.call(session:, token:, params:) }
      .to raise_error(VoiceReviews::ConfirmationService::Error, /nota/i)
  end

  it 'confirms directly from WhatsApp reply with structured headline and equipment metadata' do
    session.merge_draft!(initial_rating: 5)
    structured = VoiceReviews::StructuredExtractor.call(
      raw_text: 'O atendimento foi ótimo e instalaram inversor WEG no prazo.',
      company_name: company.name,
      review_form: review_form,
      initial_rating: 5
    )
    if session.latest_transcript.respond_to?(:structured_payload=)
      session.latest_transcript.update!(structured_payload: structured)
    end

    result = described_class.confirm_from_whatsapp!(session: session)

    review = Review.find(result[:review_id])
    expect(review.rating).to eq(5)
    expect(review.capture_flow_source).to eq('whatsapp_voice')
    expect(review.metadata['verified_by_voice']).to eq(false)
    expect(review.metadata['submitted_with_audio']).to eq(true)
    expect(review.metadata['mentioned_equipment']).to include('WEG')
  end
end
