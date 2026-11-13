require 'rails_helper'

RSpec.describe 'Decisão concorrente de reivindicação', type: :model do
  self.use_transactional_tests = false

  it 'concede acesso uma única vez quando duas aprovações ocorrem juntas' do
    admin = create(:admin_user)
    company = create(:company, status: 'active', moderation_status: 'approved')
    user = create(:user, role: 'review', status: :active, company: nil, confirmed_at: Time.current)
    request = create(:company_access_request, user: user, company: company, status: 'pending')
    barrier = Concurrent::CyclicBarrier.new(2)

    results = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          CompanyClaims::DecideRequest.call(
            request: CompanyAccessRequest.find(request.id), admin: AdminUser.find(admin.id)
          )
        end
      end
    end.map(&:value)

    expect(results).to contain_exactly(true, false)
    expect(request.reload.status).to eq('approved')
    expect(CompanyMember.where(company: company, user: user, role: :owner, status: :active).count).to eq(1)
  ensure
    CompanyMember.where(company_id: company&.id, user_id: user&.id).delete_all if company && user
    request&.destroy!
    company&.destroy!
    user&.destroy!
    admin&.destroy!
  end
end
