require 'rails_helper'

RSpec.describe Category, type: :model do
  describe 'hierarchy' do
    it 'allows setting a parent category' do
      parent = create(:category)
      child = create(:category, parent: parent)

      expect(child.parent).to eq(parent)
      expect(parent.children).to include(child)
    end

    it 'rejects self-parenting' do
      category = create(:category)
      category.parent = category

      expect(category).not_to be_valid
      expect(category.errors[:parent_id]).to be_present
    end

    it 'rejects cycles' do
      a = create(:category)
      b = create(:category, parent: a)

      a.parent = b
      expect(a).not_to be_valid
      expect(a.errors[:parent_id]).to be_present
    end
  end

  describe '#effective_rating_criteria' do
    let!(:global_criterion) { create(:rating_criterion, category: nil, slug: 'atendimento', title: 'Atendimento Global', position: 0) }
    let(:root) { create(:category, name: 'Root') }
    let!(:root_criterion) { create(:rating_criterion, category: root, slug: 'qualidade', title: 'Qualidade Root', position: 1) }
    let(:child) { create(:category, name: 'Child', parent: root) }
    let!(:child_override) { create(:rating_criterion, category: child, slug: 'atendimento', title: 'Atendimento Child', position: 0) }

    it 'resolves criteria with inheritance and overrides' do
      criteria = child.effective_rating_criteria

      # Should have 'atendimento' from child and 'qualidade' from root
      expect(criteria.map(&:slug)).to contain_exactly('atendimento', 'qualidade')

      atendimento = criteria.find { |c| c.slug == 'atendimento' }
      expect(atendimento.title).to eq('Atendimento Child')
      expect(atendimento.category_id).to eq(child.id)

      qualidade = criteria.find { |c| c.slug == 'qualidade' }
      expect(qualidade.title).to eq('Qualidade Root')
      expect(qualidade.category_id).to eq(root.id)
    end

    it 'respects position for sorting' do
      create(:rating_criterion, category: child, slug: 'z_last', position: 10)
      create(:rating_criterion, category: child, slug: 'a_first', position: -1)

      criteria = child.effective_rating_criteria
      slugs = criteria.map(&:slug)
      expect(slugs.first).to eq('a_first')
      expect(slugs.last).to eq('z_last')
    end

    it 'only returns active criteria' do
      create(:rating_criterion, category: child, slug: 'inactive', active: false)
      criteria = child.effective_rating_criteria
      expect(criteria.map(&:slug)).not_to include('inactive')
    end
  end
end
