# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewerSolution, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:events).class_name('ReviewerSolutionEvent').dependent(:restrict_with_exception) }
  end

  describe 'validations' do
    subject { build(:reviewer_solution) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:category) }
    it { should validate_inclusion_of(:solution_type).in_array(ReviewerSolution::TYPES) }
    it { should validate_inclusion_of(:status).in_array(ReviewerSolution::STATUSES) }

    it 'validates uniqueness of name scoped to user_id' do
      user = create(:user)
      create(:reviewer_solution, name: 'Unique Solution', user: user)
      duplicate = build(:reviewer_solution, name: 'Unique Solution', user: user)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:name]).to include('já está em uso')
    end
  end

  describe '#as_json' do
    let(:solution) { create(:reviewer_solution, name: 'My Solar Solution', solution_type: 'technology', category: 'Solar', verified: true, status: 'active') }

    it 'returns correctly formatted hash' do
      json = solution.as_json
      expect(json).to include(
        id: solution.id.to_s,
        name: 'My Solar Solution',
        type: 'technology',
        category: 'Solar',
        verified: true,
        status: 'active',
        companyId: nil
      )
      expect(json[:created_at]).to eq(solution.created_at.iso8601)
    end
  end
end
