require 'rails_helper'

RSpec.describe Sales::RevokeConsent do
  before { allow(Sales::AuditRecorder).to receive(:call) }
  it 'revoga consentimento do proprietário da conta' do
    actor = instance_double(User, id: 7, admin?: false)
    owner = instance_double(User, id: 7)
    account = instance_double(Sales::Account, owner_id: 7)
    contact = instance_double(Sales::Contact, account: account)
    consent = instance_double(Sales::Consent, contact: contact)
    allow(consent).to receive_messages(revoked_at: nil, granted?: true)
    allow(consent).to receive(:update!)

    expect(described_class.call(consent: consent, actor: actor)).to eq(consent)
    expect(consent).to have_received(:update!).once
  end

  it 'rejeita usuário fora da conta' do
    actor = instance_double(User, id: 8, admin?: false)
    account = instance_double(Sales::Account, owner_id: 7)
    consent = instance_double(Sales::Consent, contact: instance_double(Sales::Contact, account: account))

    expect { described_class.call(consent: consent, actor: actor) }.to raise_error(Pundit::NotAuthorizedError)
  end

  it 'não altera nem audita novamente um consentimento já revogado' do
    actor = instance_double(User, id: 7, admin?: false)
    consent = instance_double(
      Sales::Consent,
      contact: instance_double(Sales::Contact, account: instance_double(Sales::Account, owner_id: 7)),
      revoked_at: 1.hour.ago,
      granted?: false
    )

    expect(consent).not_to receive(:update!)
    expect(Sales::AuditRecorder).not_to receive(:call)
    expect(described_class.call(consent: consent, actor: actor)).to eq(consent)
  end

  it 'nega ator ausente mesmo quando a conta não tem owner' do
    consent = instance_double(
      Sales::Consent,
      contact: instance_double(Sales::Contact, account: instance_double(Sales::Account, owner_id: nil))
    )

    expect { described_class.call(consent: consent, actor: nil) }.to raise_error(Pundit::NotAuthorizedError)
  end
end
