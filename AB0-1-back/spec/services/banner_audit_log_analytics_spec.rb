require 'rails_helper'

RSpec.describe BannerAuditLogAnalytics do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  it 'agrega volume diário e ranking de atores' do
    2.times do
      BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: {})
    end
    BannerAuditLog.create!(auditable: company, actor: user, action: 'other_action', source: 'company_dashboard', metadata_json: {})

    result = described_class.call(relation: BannerAuditLog.all, days: 30, now: Time.current)

    expect(result[:total]).to eq(3)
    expect(result[:exports]).to eq(2)
    expect(result[:top_actors]).to include(hash_including(actor_id: user.id, count: 2))
    expect(result[:by_day].values.sum).to eq(2)
    expect(result[:suspicious_actors]).to be_empty
  end

  it 'marca ator com volume acima do limiar' do
    10.times do
      BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: {})
    end

    result = described_class.call(relation: BannerAuditLog.all, days: 30, now: Time.current)

    expect(result[:suspicious_actors]).to include(hash_including(actor_id: user.id, count: 10))
  end
end
