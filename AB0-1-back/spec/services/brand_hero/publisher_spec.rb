# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BrandHero::Publisher do
  let(:company) { create(:company) }

  before { allow(BrandHero::Eligibility).to receive(:allowed?).with(company).and_return(true) }

  def slide(slot:, revision:, state:, width: 1920, height: 600)
    company.company_hero_slides.create!(
      slot: slot, display_position: slot, revision: revision, status: state,
      image_width: width, image_height: height,
      image_format: 'image/png', image_bytes: 1000
    )
  end

  it 'archives the current published revision and replaces it atomically' do
    old = slide(slot: 1, revision: 1, state: 'published')
    candidate = slide(slot: 1, revision: 2, state: 'pending_review')
    allow(candidate).to receive(:ready_for_publication?).and_return(true)

    described_class.call(slide: candidate, reviewer_id: 10)

    expect(old.reload.status).to eq('archived')
    expect(candidate.reload.status).to eq('published')
    expect(candidate.reviewed_by_id).to eq(10)
    expect(company.company_hero_slides.where(status: 'published', slot: 1).count).to eq(1)
  end

  it 'keeps reordered display positions while replacing a published slide' do
    old = slide(slot: 1, revision: 1, state: 'published')
    second = slide(slot: 2, revision: 1, state: 'published')
    old.update!(display_position: 2)
    second.update!(display_position: 1)

    candidate = slide(slot: 1, revision: 2, state: 'pending_review')
    allow(candidate).to receive(:ready_for_publication?).and_return(true)
    described_class.call(slide: candidate)

    expect(candidate.reload.display_position).to eq(2)
    expect(company.company_hero_slides.published.pluck(:slot)).to eq([2, 1])
  end

  it 'refuses a publication that changes the intrinsic hero height' do
    slide(slot: 1, revision: 1, state: 'published')
    other = slide(slot: 2, revision: 1, state: 'pending_review', width: 1920, height: 800)
    allow(other).to receive(:ready_for_publication?).and_return(true)

    expect { described_class.call(slide: other) }
      .to raise_error(BrandHero::Publisher::InvalidPublication, /proporção/)
    expect(other.reload.status).to eq('pending_review')
  end

  it 'does not publish during a disabled paid-plan entitlement' do
    allow(BrandHero::Eligibility).to receive(:allowed?).with(company).and_return(false)
    candidate = slide(slot: 1, revision: 1, state: 'pending_review')
    allow(candidate).to receive(:ready_for_publication?).and_return(true)

    expect { described_class.call(slide: candidate) }
      .to raise_error(BrandHero::Publisher::InvalidPublication, /plano/)
  end
end
