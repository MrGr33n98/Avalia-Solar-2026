require 'rails_helper'

RSpec.describe BannerAddonExpirationJob, type: :job do
  it 'expira add-ons ativos vencidos e preserva os vigentes' do
    expired = create(:banner_addon_subscription, status: 'active', ends_at: 1.minute.ago)
    current = create(:banner_addon_subscription, status: 'active', ends_at: 1.minute.from_now)
    pending = create(:banner_addon_subscription, status: 'pending_payment', ends_at: 1.minute.ago)

    expect(described_class.perform_now).to be_nil
    expect(expired.reload.status).to eq('expired')
    expect(current.reload.status).to eq('active')
    expect(pending.reload.status).to eq('pending_payment')
    expect(BannerAuditLog.where(auditable: expired, action: 'expire')).to exist
  end
end
