require 'rails_helper'

RSpec.describe LeadScoringWorker, type: :worker do
  describe '#perform' do
    let(:lead) { create(:lead, system_size_band: '20-50', attribution_json: { 'roi' => 25.5 }) }

    it 'calculates a score and updates attribution_json' do
      subject.perform(lead.id)
      lead.reload
      
      expect(lead.attribution_json['lead_score']).to be_between(0, 100)
    end
  end
end
