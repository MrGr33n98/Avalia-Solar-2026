require 'rails_helper'

RSpec.describe CreatorLead, type: :model do
  it 'persists operational status and consent after reload' do
    lead = create(:creator_lead, status: 'new')
    lead.update!(status: 'qualified', admin_notes: 'Contato validado')
    persisted = described_class.find(lead.id)

    expect(persisted.status).to eq('qualified')
    expect(persisted.consent_at).to be_present
    expect(persisted.admin_notes).to eq('Contato validado')
  end
end
