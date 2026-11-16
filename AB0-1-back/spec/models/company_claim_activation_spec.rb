require 'rails_helper'

RSpec.describe Company, type: :model do
  let(:company) { create(:company, status: 'pending', moderation_status: 'pending_review') }
  let(:applicant) do
    create(:user, role: 'company', status: :pending, approved_by_admin: false, confirmed_at: nil)
  end
  let!(:request) do
    create(:company_access_request, company: company, user: applicant, status: 'pending',
           message: 'Cadastro pelo aplicativo: titularidade pendente.')
  end

  it 'rejects direct status activation while the applicant has no approved claim' do
    expect(company.update(status: 'active')).to be(false)
    expect(company.errors[:status].join).to include('aprovação da titularidade')
    expect(company.reload.status).to eq('pending')
  end

  it 'rejects activation even when admin approved the claim but email is unconfirmed' do
    admin = create(:admin_user)
    expect(CompanyClaims::DecideRequest.call(request: request, admin: admin)).to be(true)
    expect(request.reload.status).to eq('approved')
    expect(applicant.reload.confirmed?).to be(false)

    expect(company.update(status: 'active')).to be(false)
    expect(company.reload.status).to eq('pending')
    expect(company.company_members.active.owners).not_to exist
  end
end
