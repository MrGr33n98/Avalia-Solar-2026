require 'rails_helper'

RSpec.describe SectorRating, type: :model do
  describe '.ransackable_attributes' do
    it 'allows ActiveAdmin filters and sorting fields' do
      expect(described_class.ransackable_attributes).to include(
        'company_id',
        'user_id',
        'status',
        'total_score',
        'created_at'
      )
    end
  end

  describe '.ransackable_associations' do
    it 'allows ActiveAdmin to filter through company and user' do
      expect(described_class.ransackable_associations).to include('company', 'user')
    end
  end
end
