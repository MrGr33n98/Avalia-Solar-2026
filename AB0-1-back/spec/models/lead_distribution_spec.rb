require 'rails_helper'

RSpec.describe LeadDistribution, type: :model do
  let(:distribution) { create(:lead_distribution, status: :sent) }

  it 'transita de sent para viewed e accepted' do
    distribution.mark_viewed!
    expect(distribution.reload).to be_viewed_status

    distribution.accept!
    expect(distribution.reload).to be_accepted_status
    expect(distribution.accepted_at).to be_present
  end

  it 'valida reason de rejeição' do
    expect { distribution.reject!('unknown') }.to raise_error(ArgumentError)
  end

  it 'permite rejeição com reason code' do
    distribution.reject!('outside_area')

    expect(distribution.reload).to be_rejected_status
    expect(distribution.rejection_reason).to eq('outside_area')
  end

  describe 'validações de transição de estado' do
    it 'não permite transição de converted para rejected' do
      dist = create(:lead_distribution, status: :converted)
      dist.status = :rejected
      expect(dist.save).to be false
      expect(dist.errors[:status]).to include(/Transição de status inválida/)
    end

    it 'não permite transição de expired para accepted' do
      dist = create(:lead_distribution, status: :expired)
      dist.status = :accepted
      expect(dist.save).to be false
      expect(dist.errors[:status]).to include(/Transição de status inválida/)
    end

    it 'não permite transição de queued para converted' do
      dist = create(:lead_distribution, status: :queued)
      dist.status = :converted
      expect(dist.save).to be false
      expect(dist.errors[:status]).to include(/Transição de status inválida/)
    end

    it 'permite transição válida queued -> sent' do
      dist = create(:lead_distribution, status: :queued)
      dist.status = :sent
      expect(dist.save).to be true
    end
  end
end
