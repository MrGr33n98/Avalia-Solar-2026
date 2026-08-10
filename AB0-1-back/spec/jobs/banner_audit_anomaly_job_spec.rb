require 'rails_helper'

RSpec.describe BannerAuditAnomalyJob, type: :job do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before do
    10.times do
      BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: {})
    end
  end

  it 'persiste um alerta e aplica cooldown' do
    now = Time.current
    expect(described_class.perform_now(now)).to include(candidates: 1, alerted: 1)
    expect(described_class.perform_now(now + 1.hour)).to include(candidates: 1, alerted: 0)
    alert = BannerAuditLog.find_by(action: 'suspicious_export_alert')
    expect(alert.metadata_json).to include('status' => 'open', 'count' => 10)
  end
end
