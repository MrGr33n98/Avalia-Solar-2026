# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewerSolution, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:brand).optional }
    it { should belong_to(:product).optional }
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
      expect(duplicate.errors[:name]).to include(I18n.t('errors.messages.taken')).or include('já está em uso')
    end

    it 'validates that product belongs to the selected brand' do
      brand1 = create(:brand, name: 'Growatt')
      brand2 = create(:brand, name: 'Fronius')
      product = create(:product, name: 'Inversor 5kW', brand: brand1)

      mismatched = build(:reviewer_solution, brand: brand2, product: product)
      expect(mismatched).not_to be_valid
      expect(mismatched.errors[:product_id]).to include('não pertence à marca selecionada')

      matched = build(:reviewer_solution, brand: brand1, product: product)
      expect(matched).to be_valid
    end

    it 'auto-syncs brand_id from product when brand_id is not specified' do
      brand = create(:brand, name: 'Huawei')
      product = create(:product, name: 'Inversor SUN2000', brand: brand)

      solution = build(:reviewer_solution, brand: nil, product: product)
      solution.valid?
      expect(solution.brand_id).to eq(brand.id)
    end
  end

  describe '#as_json' do
    let(:brand) { create(:brand, name: 'Growatt Solar', slug: 'growatt') }
    let(:product) { create(:product, name: 'MIN 5000TL-X', brand: brand) }
    let(:solution) do
      create(:reviewer_solution,
             name: 'Meu Inversor Growatt',
             solution_type: 'product',
             category: 'Energia Solar',
             verified: true,
             status: 'active',
             brand: brand,
             product: product,
             usage_context: 'integrator_install')
    end

    it 'returns correctly formatted hash with brand and product metadata' do
      json = solution.as_json
      expect(json).to include(
        id: solution.id.to_s,
        name: 'Meu Inversor Growatt',
        type: 'product',
        category: 'Energia Solar',
        verified: true,
        status: 'active',
        companyId: nil,
        brand_id: brand.id,
        product_id: product.id,
        usage_context: 'integrator_install'
      )
      expect(json[:brand]).to include(
        id: brand.id,
        name: 'Growatt Solar',
        slug: 'growatt',
        initials: 'GS'
      )
      expect(json[:product]).to include(
        id: product.id,
        name: 'MIN 5000TL-X'
      )
      expect(json[:created_at]).to eq(solution.created_at.iso8601)
    end
  end
end
