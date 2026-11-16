# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyHeroSlide, type: :model do
  let(:company) { create(:company) }

  it 'limits slots to 1..3 and accepts an unpublished draft without deleting the legacy banner' do
    record = described_class.new(company: company, slot: 4, display_position: 4,
                                 revision: 1, status: 'draft')
    expect(record).not_to be_valid
    expect(record.errors[:slot]).not_to be_empty

    record.slot = 1
    record.display_position = 1
    expect(record).to be_valid
    expect(company).to respond_to(:banner)
  end

  it 'rejects unknown states and too-long alt text' do
    slide = described_class.new(company: company, slot: 1, display_position: 1,
                                revision: 1, status: 'ready', alt_text: 'A' * 161)
    expect(slide).not_to be_valid
    expect(slide.errors.attribute_names).to include(:status, :alt_text)
  end

  it 'requires verified dimensions and image before public publication' do
    slide = described_class.new(company: company, slot: 1, display_position: 1, revision: 1,
                                status: 'approved', image_width: 1920, image_height: 600,
                                image_bytes: 1000, image_format: 'image/png')
    expect(slide.aspect_ratio).to eq(3.2)
    expect(slide.ready_for_publication?).to be(false)
  end
end
