require 'rails_helper'

RSpec.describe RoiCalculationWorker, type: :worker do
  describe '#perform' do
    let(:lead) { create(:lead, zipcode: '12345-678', monthly_kwh: 500) }

    it 'calculates ROI and updates attribution_json' do
      # Setup mock tariff
      ExternalTariffsCache.create!(cep_prefix: '12345', distributor: 'Test', tariff_kwh: 0.8)
      
      expect {
        subject.perform(lead.id)
      }.to change { lead.reload.attribution_json }
      
      expect(lead.attribution_json['roi']).to be_present
      expect(lead.attribution_json['payback_years']).to be_present
    end
    
    it 'triggers LeadScoringWorker' do
      expect(LeadScoringWorker).to receive(:perform_async).with(lead.id)
      subject.perform(lead.id)
    end
  end
end
