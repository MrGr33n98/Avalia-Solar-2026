# frozen_string_literal: true

# RSpec Tests - Banner Model Validations (Fase 1)
#
# Testa todas as novas validações implementadas:
# 1. Validação de datas (end_date > start_date)
# 2. Validação de dimensões obrigatórias
# 3. Validação de priority
# 4. Validação de limite de banners por empresa
# 5. Invalidação de cache

require 'rails_helper'

RSpec.describe Banner, type: :model do
  describe 'associations' do
    it { should belong_to(:category).optional }
    it { should belong_to(:company).optional }
    it { should belong_to(:approved_by_admin_user).optional }
    it { should have_and_belong_to_many(:categories) }
    it { should have_one_attached(:image) }
  end

  describe 'validations' do
    describe 'basic validations' do
      it { should validate_presence_of(:title) }
      it { should validate_presence_of(:banner_type) }
      it { should validate_presence_of(:position) }
      it { should validate_presence_of(:image) }
    end

    describe 'inclusion validations' do
      it { should validate_inclusion_of(:banner_type).in_array(Banner::ALLOWED_BANNER_TYPES) }
      it { should validate_inclusion_of(:position).in_array(Banner::ALLOWED_POSITIONS) }
      it { should validate_inclusion_of(:moderation_status).in_array(Banner::MODERATION_STATUSES) }

      it 'allows the public conversion banner positions' do
        expect(Banner::ALLOWED_POSITIONS).to include(
          'search_top',
          'search_mid',
          'categories_filter_sidebar',
          'categories_right_rail',
          'companies_right_rail',
          'compare_hero',
          'comparison_floating_bar'
        )
      end
    end

    describe 'dimensions validations (Fase 1)' do
      let(:banner) { build(:banner) }

      it 'validates presence of width' do
        banner.width = nil
        expect(banner).not_to be_valid
        expect(banner.errors[:width]).to include("can't be blank")
      end

      it 'validates presence of height' do
        banner.height = nil
        expect(banner).not_to be_valid
        expect(banner.errors[:height]).to include("can't be blank")
      end

      it 'validates width is greater than 0' do
        banner.width = 0
        expect(banner).not_to be_valid
        expect(banner.errors[:width]).to include('must be greater than 0')
      end

      it 'validates height is greater than 0' do
        banner.height = 0
        expect(banner).not_to be_valid
        expect(banner.errors[:height]).to include('must be greater than 0')
      end

      it 'accepts valid dimensions' do
        banner.width = 960
        banner.height = 100
        expect(banner).to be_valid
      end
    end

    describe 'priority validation (Fase 1)' do
      let(:banner) { build(:banner) }

      it 'allows nil priority (uses default)' do
        banner.priority = nil
        expect(banner).to be_valid
      end

      it 'validates priority is between 1 and 1000' do
        banner.priority = 0
        expect(banner).not_to be_valid

        banner.priority = 1001
        expect(banner).not_to be_valid

        banner.priority = 500
        expect(banner).to be_valid
      end

      it 'validates priority is an integer' do
        banner.priority = 50.5
        expect(banner).not_to be_valid
      end
    end

    describe 'date validation (Fase 1 - CRÍTICO)' do
      let(:banner) { build(:banner) }

      context 'when both dates are present' do
        it 'is invalid when end_date is before start_date' do
          banner.start_date = 1.day.from_now
          banner.end_date = Time.current

          expect(banner).not_to be_valid
          expect(banner.errors[:end_date]).to include('deve ser posterior à data de início')
        end

        it 'is valid when end_date is after start_date' do
          banner.start_date = Time.current
          banner.end_date = 1.day.from_now

          expect(banner).to be_valid
        end

        it 'is valid when end_date equals start_date' do
          now = Time.current
          banner.start_date = now
          banner.end_date = now

          expect(banner).to be_valid
        end
      end

      context 'when dates are nil' do
        it 'is valid when both dates are nil' do
          banner.start_date = nil
          banner.end_date = nil

          expect(banner).to be_valid
        end

        it 'is valid when only start_date is nil' do
          banner.start_date = nil
          banner.end_date = 1.day.from_now

          expect(banner).to be_valid
        end

        it 'is valid when only end_date is nil' do
          banner.start_date = Time.current
          banner.end_date = nil

          expect(banner).to be_valid
        end
      end
    end

    describe 'company banners limit validation (Fase 1)' do
      let(:company) { create(:company) }
      let(:banner_offer) { create(:banner_offer, :with_limits) }
      let!(:subscription) do
        create(:banner_subscription, :active,
               company: company,
               banner_offer: banner_offer)
      end

      context 'when company has active subscription' do
        it 'validates total active banners limit' do
          # Assume offer has max_total_active: 3
          create_list(:banner, 3, company: company, active: true)

          new_banner = build(:banner, company: company, active: true)
          expect(new_banner).not_to be_valid
          expect(new_banner.errors[:base]).to include(/Limite de .* banners ativos atingido/)
        end

        it 'validates position-specific limit' do
          # Assume offer has max_active_per_position: 2
          create_list(:banner, 2, company: company, active: true, position: 'navbar')

          new_banner = build(:banner, company: company, active: true, position: 'navbar')
          expect(new_banner).not_to be_valid
          expect(new_banner.errors[:position]).to include(/Limite de .* banners ativos na posição/)
        end

        it 'allows creating banner when under limit' do
          create(:banner, company: company, active: true)

          new_banner = build(:banner, company: company, active: true)
          expect(new_banner).to be_valid
        end

        it 'does not validate limit for inactive banners' do
          create_list(:banner, 5, company: company, active: true)

          new_banner = build(:banner, company: company, active: false)
          expect(new_banner).to be_valid
        end
      end

      context 'when company has no subscription' do
        let(:company_no_sub) { create(:company) }

        it 'allows creating banner' do
          banner = build(:banner, company: company_no_sub, active: true)
          expect(banner).to be_valid
        end
      end
    end
  end

  describe '.default_dimensions_for_position' do
    it 'returns dimensions for managed conversion slots' do
      expect(described_class.default_dimensions_for_position('categories_filter_sidebar')).to eq([300, 250])
      expect(described_class.default_dimensions_for_position('categories_right_rail')).to eq([300, 600])
      expect(described_class.default_dimensions_for_position('companies_right_rail')).to eq([300, 600])
      expect(described_class.default_dimensions_for_position('search_top')).to eq([1200, 180])
      expect(described_class.default_dimensions_for_position('search_mid')).to eq([1200, 160])
      expect(described_class.default_dimensions_for_position('compare_hero')).to eq([1200, 300])
    end
  end

  describe 'scopes' do
    describe '.currently_active' do
      let!(:active_approved) { create(:banner, :approved, active: true) }
      let!(:inactive_banner) { create(:banner, active: false) }
      let!(:draft_banner) { create(:banner, :draft, active: true) }
      let!(:expired_banner) do
        create(:banner, :approved, active: true,
                                   start_date: 2.days.ago,
                                   end_date: 1.day.ago)
      end
      let!(:future_banner) do
        create(:banner, :approved, active: true,
                                   start_date: 1.day.from_now,
                                   end_date: 2.days.from_now)
      end

      it 'returns only active and approved banners' do
        expect(Banner.currently_active).to include(active_approved)
        expect(Banner.currently_active).not_to include(inactive_banner)
        expect(Banner.currently_active).not_to include(draft_banner)
      end

      it 'respects date ranges' do
        expect(Banner.currently_active).not_to include(expired_banner)
        expect(Banner.currently_active).not_to include(future_banner)
      end

      it 'includes banners with nil dates' do
        nil_dates_banner = create(:banner, :approved, active: true, start_date: nil, end_date: nil)
        expect(Banner.currently_active).to include(nil_dates_banner)
      end
    end
  end

  describe 'callbacks' do
    describe 'ensure_dimensions' do
      context 'when dimensions are not provided' do
        it 'sets default dimensions for navbar' do
          banner = build(:banner, position: 'navbar', width: nil, height: nil)
          banner.valid?

          expect(banner.width).to eq(960)
          expect(banner.height).to eq(100)
        end

        it 'sets default dimensions for sidebar' do
          banner = build(:banner, position: 'sidebar', width: nil, height: nil)
          banner.valid?

          expect(banner.width).to eq(150)
          expect(banner.height).to eq(125)
        end

        it 'sets compact dimensions for the comparison floating bar' do
          banner = build(:banner, position: 'comparison_floating_bar', width: nil, height: nil)
          banner.valid?

          expect(banner.width).to eq(720)
          expect(banner.height).to eq(120)
        end

        it 'sets default dimensions for other positions' do
          banner = build(:banner, position: 'categories_top', width: nil, height: nil)
          banner.valid?

          expect(banner.width).to eq(600)
          expect(banner.height).to eq(200)
        end
      end

      context 'when dimensions are provided' do
        it 'does not override provided dimensions' do
          banner = build(:banner, position: 'navbar', width: 1200, height: 200)
          banner.valid?

          expect(banner.width).to eq(1200)
          expect(banner.height).to eq(200)
        end
      end
    end

    describe 'invalidate_cache (Fase 1)' do
      let(:banner) { create(:banner) }

      before do
        allow(Banners::CacheInvalidatorService).to receive(:call)
        allow(Rails.logger).to receive(:info)
      end

      it 'invalidates cache after save' do
        banner.update(title: 'New Title')

        expect(Banners::CacheInvalidatorService).to have_received(:call).with(banner)
        expect(Rails.logger).to have_received(:info).with(/Cache invalidado/)
      end

      it 'invalidates cache after destroy' do
        banner.destroy

        expect(Banners::CacheInvalidatorService).to have_received(:call).with(banner)
      end

      it 'logs error if cache invalidation fails' do
        allow(Banners::CacheInvalidatorService).to receive(:call).and_raise(StandardError.new('Redis error'))
        allow(Rails.logger).to receive(:error)

        banner.update(title: 'New Title')

        expect(Rails.logger).to have_received(:error).with(/Erro ao invalidar cache/)
      end
    end
  end

  describe 'instance methods' do
    describe '#image_url' do
      let(:banner) { create(:banner, :with_image) }

      it 'returns URL for attached image' do
        expect(banner.image_url).to be_present
        expect(banner.image_url).to include('rails/active_storage')
      end

      it 'returns nil when no image attached' do
        banner.image.purge
        expect(banner.image_url).to be_nil
      end
    end

    describe '#submit_for_review!' do
      let(:banner) { create(:banner, :draft) }

      it 'changes status to submitted' do
        banner.submit_for_review!
        expect(banner.moderation_status).to eq('submitted')
      end

      it 'deactivates banner' do
        banner.update(active: true)
        banner.submit_for_review!
        expect(banner.active).to be false
      end
    end

    describe '#approve!' do
      let(:admin) { create(:admin_user) }
      let(:banner) { create(:banner, :submitted) }

      it 'changes status to approved' do
        banner.approve!(admin)
        expect(banner.moderation_status).to eq('approved')
      end

      it 'sets approved_by and approved_at' do
        banner.approve!(admin)
        expect(banner.approved_by_admin_user).to eq(admin)
        expect(banner.approved_at).to be_present
      end

      it 'clears rejected_reason' do
        banner.update(rejected_reason: 'Test reason')
        banner.approve!(admin)
        expect(banner.rejected_reason).to be_nil
      end
    end

    describe '#reject!' do
      let(:admin) { create(:admin_user) }
      let(:banner) { create(:banner, :submitted) }

      it 'changes status to rejected' do
        banner.reject!(admin, 'Invalid content')
        expect(banner.moderation_status).to eq('rejected')
      end

      it 'sets rejected_reason' do
        banner.reject!(admin, 'Invalid content')
        expect(banner.rejected_reason).to eq('Invalid content')
      end

      it 'deactivates banner' do
        banner.update(active: true)
        banner.reject!(admin, 'Invalid content')
        expect(banner.active).to be false
      end
    end
  end
end
