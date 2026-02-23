require 'rails_helper'

RSpec.describe ReviewDecisionService do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'review', company: nil, status: :active) }
  let(:review) do
    create(
      :review,
      company: company,
      user: user,
      status: :pending,
      featured: false
    )
  end

  let!(:admin_user) do
    AdminUser.create!(
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  before do
    allow(ReviewDecisionNotifier).to receive(:with).and_return(double(deliver_later: true))
    allow(ReviewDecisionMailer).to receive(:with).and_return(double(decision_notification: double(deliver_later: true)))
  end

  describe '#approve!' do
    it 'approves the review and logs the decision' do
      service = described_class.new(review: review, admin_user: admin_user)

      expect { service.approve! }.to change { review.reload.status }.from('pending').to('approved')
      log = review.review_decision_logs.last
      expect(log.admin_user).to eq(admin_user)
      expect(log.new_status).to eq('approved')
    end
  end

  describe '#reject!' do
    it 'rejects the review and records notes' do
      service = described_class.new(review: review, admin_user: admin_user, notes: 'Conteúdo inválido')

      service.reject!
      expect(review.reload.rejected?).to be true
      expect(review.review_decision_logs.last.notes).to include('Conteúdo inválido')
    end
  end

  it 'raises a permission error when no admin user is provided' do
    service = described_class.new(review: review, admin_user: nil)
    expect { service.approve! }.to raise_error(ReviewDecisionService::PermissionError)
  end

  it 'translates stale object errors into decision errors' do
    allow(review).to receive(:update!).and_raise(ActiveRecord::StaleObjectError.new(review, 'update'))
    service = described_class.new(review: review, admin_user: admin_user)
    expect { service.approve! }.to raise_error(ReviewDecisionService::DecisionError)
  end
end
