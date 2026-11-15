require 'rails_helper'

RSpec.describe CompanyClaims::DecideRequest do
  let(:admin) { create(:admin_user) }
  let(:company) { create(:company, status: 'active', moderation_status: 'approved') }
  let(:user) { create(:user, role: 'review', status: :active, company: nil, confirmed_at: Time.current) }
  let(:request) { create(:company_access_request, user: user, company: company, status: 'pending') }

  it 'aprova com membro proprietário ativo e preserva a verificação institucional' do
    verified_before = company.verified

    expect(described_class.call(request: request, admin: admin)).to be true
    expect(request.reload.status).to eq('approved')
    expect(CompanyMember.find_by!(user: user, company: company)).to have_attributes(role: 'owner', status: 'active')
    expect(company.reload.verified).to eq(verified_before)
  end

  it 'requires verified email before activating a pending WhatsApp company owner' do
    candidate_company = create(:company, status: 'pending', moderation_status: 'pending_review')
    candidate = create(:user, role: 'company', status: :pending,
                              company: nil, confirmed_at: nil, approved_by_admin: false)
    claim = create(:company_access_request, user: candidate, company: candidate_company, status: 'pending')

    expect(described_class.call(request: claim, admin: admin)).to be true
    expect(claim.reload).to be_approved
    expect(candidate.reload).to be_pending
    expect(candidate).not_to be_confirmed
    expect(CompanyMember.where(user: candidate, company: candidate_company)).not_to exist
    expect(candidate_company.reload.status).to eq('pending')

    candidate.confirm

    expect(candidate.reload).to be_confirmed
    expect(candidate).to be_active
    expect(CompanyMember.find_by!(user: candidate, company: candidate_company))
      .to have_attributes(role: 'owner', status: 'active')
    expect(candidate_company.reload.status).to eq('active')
  end

  it 'does not grant company access from an approved status without admin review' do
    request.update!(status: 'approved')
    expect(CompanyMember.where(user: user, company: company)).not_to exist
  end

  it 'reverte a aprovação quando a concessão de acesso falha' do
    allow_any_instance_of(CompanyMember).to receive(:update!).and_raise(ActiveRecord::RecordInvalid)

    expect { described_class.call(request: request, admin: admin) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(request.reload.status).to eq('pending')
    expect(CompanyMember.where(user: user, company: company)).not_to exist
  end

  it 'é idempotente e não aceita decisão de quem não é administrador' do
    expect { described_class.call(request: request, admin: user) }.to raise_error(Pundit::NotAuthorizedError)
    expect(described_class.call(request: request, admin: admin)).to be true
    expect(described_class.call(request: request, admin: admin)).to be false
    expect(CompanyMember.where(user: user, company: company).count).to eq(1)
  end

  it 'não reabre uma solicitação rejeitada' do
    expect(described_class.reject!(request: request, admin: admin, reason: 'Sem vínculo comprovado')).to eq(:rejected)
    expect { described_class.call(request: request, admin: admin) }
      .to raise_error(described_class::InvalidTransition)
    expect(CompanyMember.where(user: user, company: company)).not_to exist
  end

  it 'não rejeita uma aprovação existente nem aceita motivo vazio' do
    expect { described_class.reject!(request: request, admin: admin, reason: '') }.to raise_error(ArgumentError)
    described_class.call(request: request, admin: admin)
    expect { described_class.reject!(request: request, admin: admin, reason: 'Motivo') }
      .to raise_error(described_class::InvalidTransition)
    expect(request.reload.status).to eq('approved')
  end
end
