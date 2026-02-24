require 'rails_helper'

RSpec.describe CompanyPolicy do
  subject(:policy) { described_class.new(user, company) }

  let(:company) { create(:company) }

  describe '#update?' do
    context 'when user is admin' do
      let(:user) { create(:user, role: 'admin', company: nil) }

      it 'allows update' do
        expect(policy.update?).to be(true)
      end
    end

    context 'when user owns the company directly' do
      let(:user) { create(:user, role: 'company', company: company) }

      it 'allows update' do
        expect(policy.update?).to be(true)
      end
    end

    context 'when user is active editor member' do
      let(:user) { create(:user, role: 'company', company: nil) }

      before do
        create(:company_member, company: company, user: user, role: :editor, status: 'active')
      end

      it 'allows update' do
        expect(policy.update?).to be(true)
      end
    end

    context 'when user is revoked member' do
      let(:user) { create(:user, role: 'company', company: nil) }

      before do
        create(:company_member, company: company, user: user, role: :editor, status: 'revoked')
      end

      it 'forbids update' do
        expect(policy.update?).to be(false)
      end
    end

    context 'when user is not member of the company' do
      let(:user) { create(:user, role: 'company') }

      it 'forbids update' do
        expect(policy.update?).to be(false)
      end
    end
  end
end
