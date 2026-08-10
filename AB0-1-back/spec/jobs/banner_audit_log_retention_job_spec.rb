require 'rails_helper'

RSpec.describe BannerAuditLogRetentionJob, type: :job do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  it 'reporta candidatos e preserva logs e alertas' do
    old = BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: {})
    alert = BannerAuditLog.create!(auditable: user, actor: user, action: 'suspicious_export_alert', source: 'job', metadata_json: { 'status' => 'open' })
    BannerAuditLog.where(id: [old.id, alert.id]).update_all(created_at: 25.months.ago)

    result = described_class.perform_now(Time.current)

    expect(result).to include(candidates: 1, dry_run: true)
    expect(BannerAuditLog.where(id: [old.id, alert.id]).count).to eq(2)
  end
end
