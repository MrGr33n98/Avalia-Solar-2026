require 'rails_helper'

RSpec.describe Review, type: :model do
  let!(:paid_plan) { create(:plan, price: 199.9, features: { social_proof: true }.to_json) }
  let!(:company) do
    create(
      :company,
      plan: paid_plan,
      social_proof_enabled: true
    )
  end

  before do
    allow(SlackNotificationService).to receive(:notify_review)
    allow(Analytics::TrackEventService).to receive(:call)
  end

  def create_reviewer(index)
    create(
      :user,
      email: "reviewer-#{index}@example.com",
      role: 'review',
      status: :active,
      company: nil,
      city: 'Sao Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  it 'enforces max featured reviews per company' do
    Review::MAX_FEATURED_PER_COMPANY.times do |index|
      create(
        :review,
        company: company,
        user: create_reviewer(index),
        status: :approved,
        featured: true,
        display_order: index
      )
    end

    extra_review = build(
      :review,
      company: company,
      user: create_reviewer(999),
      status: :approved,
      featured: true,
      display_order: 99
    )

    expect(extra_review).not_to be_valid
    expect(extra_review.errors[:featured].join(' ')).to include('limit reached')
  end
end
