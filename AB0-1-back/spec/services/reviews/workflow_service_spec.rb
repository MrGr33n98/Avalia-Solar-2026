require 'rails_helper'

RSpec.describe Reviews::WorkflowService, type: :service do
  let(:actor) { create(:user, role: :admin) }
  let(:review) do
    create(
      :review,
      status: :approved,
      verified: false,
      verification_status: 'pending'
    )
  end

  it 'keeps moderation and verification as independent decisions' do
    service = described_class.new(review: review, actor: actor)

    service.moderate!(status: 'rejected', notes: 'Conteúdo incompatível com as regras.')
    review.reload

    expect(review.status).to eq('rejected')
    expect(review.verification_status).to eq('pending')
    expect(review.verified).to eq(false)

    service.verify!(status: 'manually_verified', notes: 'Origem confirmada manualmente.')
    review.reload

    expect(review.status).to eq('rejected')
    expect(review.verification_status).to eq('manually_verified')
    expect(review.verified).to eq(true)
    expect(review.review_audit_events.pluck(:event_type)).to eq(
      %w[moderation_changed verification_changed]
    )
  end
end
