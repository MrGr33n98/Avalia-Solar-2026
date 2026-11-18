# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewerPortfolioProject, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:project_brands).class_name('ReviewerPortfolioProjectBrand').dependent(:destroy) }
    it { should have_many(:brand_usages).through(:project_brands) }
    it { should have_many(:events).class_name('ReviewerPortfolioProjectEvent').dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:reviewer_portfolio_project) }

    it { should validate_presence_of(:title) }
    it { should validate_length_of(:title).is_at_most(160) }
    it { should validate_presence_of(:project_type) }
    it { should validate_inclusion_of(:project_type).in_array(ReviewerPortfolioProject::PROJECT_TYPES) }
    it { should validate_inclusion_of(:status).in_array(ReviewerPortfolioProject::STATUSES) }
    it { should validate_inclusion_of(:visibility).in_array(ReviewerPortfolioProject::VISIBILITIES) }
    it { should validate_inclusion_of(:verification_status).in_array(ReviewerPortfolioProject::VERIFICATION_STATUSES) }
    it { should validate_numericality_of(:capacity_kwp).is_greater_than_or_equal_to(0).allow_nil }

    it 'rejects started_at in the future' do
      project = build(:reviewer_portfolio_project, started_at: 1.day.from_now.to_date)
      expect(project).not_to be_valid
      expect(project.errors[:started_at]).to include('não pode ser uma data futura')
    end

    it 'rejects completed_at before started_at' do
      project = build(:reviewer_portfolio_project,
                      started_at: 1.month.ago.to_date,
                      completed_at: 2.months.ago.to_date)
      expect(project).not_to be_valid
      expect(project.errors[:completed_at]).to include('não pode ser anterior à data de início')
    end

    it 'requires consent_version when visibility is public' do
      project = build(:reviewer_portfolio_project, visibility: 'public', consent_version: nil)
      expect(project).not_to be_valid
      expect(project.errors[:consent_version]).to include('é obrigatório para projetos públicos')
    end

    it 'prevents linking brand_usage belonging to a different user' do
      user_a = create(:user)
      user_b = create(:user)
      brand = create(:brand, name: 'Solis')
      usage_b = create(:reviewer_brand_usage, user: user_b, brand: brand)
      project_a = create(:reviewer_portfolio_project, user: user_a)

      join = ReviewerPortfolioProjectBrand.new(
        reviewer_portfolio_project: project_a,
        reviewer_brand_usage: usage_b
      )

      expect(join).not_to be_valid
      expect(join.errors[:reviewer_brand_usage_id]).to include('não pertence ao mesmo proprietário do projeto')
    end
  end

  describe '#as_owner_json' do
    let(:user) { create(:user) }
    let(:brand) { create(:brand, name: 'Canadian Solar', slug: 'canadian') }
    let(:usage) { create(:reviewer_brand_usage, user: user, brand: brand, usage_context: 'integrator_install') }
    let(:project) { create(:reviewer_portfolio_project, user: user, title: 'Projeto Comercial 50kWp', capacity_kwp: 50.0) }

    before do
      project.project_brands.create!(reviewer_brand_usage: usage)
    end

    it 'serializes project with nested owner brands and truthful capacity' do
      json = project.as_owner_json
      expect(json[:title]).to eq('Projeto Comercial 50kWp')
      expect(json[:capacity_kwp]).to eq(50.0)
      expect(json[:brands].length).to eq(1)
      expect(json[:brands].first[:brand_name]).to eq('Canadian Solar')
    end
  end
end
