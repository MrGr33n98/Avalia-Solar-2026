# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Metering Atomicity & Quota Concurrency (Wave 2C)', type: :service do
  self.use_transactional_tests = false

  let(:pro_plan) do
    Plan.find_by(name: 'Pro Concurrency') || create(
      :plan,
      name: 'Pro Concurrency',
      features_json: {
        'featured_products' => 1,
        'company_categories_limit' => 2,
        'service_area_cities_limit' => 1,
        'service_area_states_limit' => 1,
        'product_images_limit' => 1,
        'media_upload' => true
      }
    )
  end

  let(:free_plan) do
    Plan.find_by(name: 'Free Concurrency') || create(
      :plan,
      name: 'Free Concurrency',
      features_json: {
        'featured_products' => 0,
        'company_categories_limit' => 0,
        'service_area_cities_limit' => 0,
        'service_area_states_limit' => 0,
        'product_images_limit' => 0,
        'media_upload' => false
      }
    )
  end

  let(:unlimited_plan) do
    Plan.find_by(name: 'Unlimited Concurrency') || create(
      :plan,
      name: 'Unlimited Concurrency',
      features_json: {
        'featured_products' => true,
        'company_categories_limit' => true,
        'service_area_cities_limit' => true,
        'service_area_states_limit' => true,
        'product_images_limit' => true,
        'media_upload' => true
      }
    )
  end

  let(:company_a) { Company.find_by(name: 'Empresa Alfa Concurrency') || create(:company, name: 'Empresa Alfa Concurrency', plan: pro_plan, coverage_cities: nil, coverage_states: nil) }
  let(:company_b) { Company.find_by(name: 'Empresa Beta Concurrency') || create(:company, name: 'Empresa Beta Concurrency', plan: pro_plan, coverage_cities: nil, coverage_states: nil) }
  let(:category_1) { Category.find_by(name: 'Solar Residencial Conc 1') || create(:category, name: 'Solar Residencial Conc 1') }
  let(:category_2) { Category.find_by(name: 'Solar Residencial Conc 2') || create(:category, name: 'Solar Residencial Conc 2') }

  before(:each) do
    company_a.update_columns(coverage_cities: nil, coverage_states: nil)
    company_a.products.destroy_all
    company_b.update_columns(coverage_cities: nil, coverage_states: nil)
    company_b.products.destroy_all
  end

  after(:all) do
    Product.where("sku LIKE 'SKU-%-CONC%'").destroy_all rescue nil
    Company.where(name: ['Empresa Alfa Concurrency', 'Empresa Beta Concurrency', 'Empresa Free Zero', 'Empresa Unlimited']).destroy_all rescue nil
    Category.where(name: ['Solar Residencial Conc 1', 'Solar Residencial Conc 2']).destroy_all rescue nil
    Plan.where(name: ['Pro Concurrency', 'Free Concurrency', 'Unlimited Concurrency']).destroy_all rescue nil
  end

  describe '1. Featured Products Atomicity' do
    it 'prevents race condition: 2 concurrent threads racing for 1 quota slot results in exactly 1 success and 1 error' do
      product_1 = create(:product, company: company_a, name: 'Painel A1', sku: "SKU-A1-CONC-#{SecureRandom.hex(4)}", featured: false)
      product_2 = create(:product, company: company_a, name: 'Painel A2', sku: "SKU-A2-CONC-#{SecureRandom.hex(4)}", featured: false)

      results = []
      errors = []
      barrier = Concurrent::CyclicBarrier.new(2)

      t1 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'featured_products') do
              product_1.update!(featured: true)
            end
            results << :success_1
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      t2 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'featured_products') do
              product_2.update!(featured: true)
            end
            results << :success_2
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      [t1, t2].each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(errors.first).to be_a(EntitlementService::QuotaExceededError)

      featured_count = company_a.products.where(featured: true).count
      expect(featured_count).to eq(1)
      expect(EntitlementService.usage(company: company_a, feature: 'featured_products')).to eq(1)
      expect(EntitlementService.remaining(company: company_a, feature: 'featured_products')).to eq(0)
    end
  end

  describe '2. Company Categories Limit Atomicity' do
    it 'prevents race condition when concurrently attaching categories up to limit 2 (1 existing + 1 slot available)' do
      # Ensure company_a currently has 1 category
      company_a.categories = [company_a.categories.first || category_1]
      expect(company_a.categories.count).to eq(1)
      expect(EntitlementService.remaining(company: company_a, feature: 'company_categories_limit')).to eq(1)

      cat_a = Category.find_by(name: 'Cat Extra A') || create(:category, name: 'Cat Extra A', description: 'Desc A')
      cat_b = Category.find_by(name: 'Cat Extra B') || create(:category, name: 'Cat Extra B', description: 'Desc B')

      results = []
      errors = []
      barrier = Concurrent::CyclicBarrier.new(2)

      t1 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'company_categories_limit') do
              company_a.categories << cat_a
            end
            results << :success_1
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      t2 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'company_categories_limit') do
              company_a.categories << cat_b
            end
            results << :success_2
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      [t1, t2].each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(errors.first).to be_a(EntitlementService::QuotaExceededError)

      expect(company_a.reload.categories.count).to eq(2)
      expect(EntitlementService.remaining(company: company_a, feature: 'company_categories_limit')).to eq(0)
    end
  end

  describe '3. Service Area Cities Limit Atomicity' do
    it 'prevents race condition when adding service area cities up to limit 1' do
      results = []
      errors = []
      barrier = Concurrent::CyclicBarrier.new(2)

      t1 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'service_area_cities_limit') do
              company_a.update_columns(coverage_cities: 'São Paulo')
            end
            results << :success_1
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      t2 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'service_area_cities_limit') do
              company_a.update_columns(coverage_cities: 'Campinas')
            end
            results << :success_2
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      [t1, t2].each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(EntitlementService.usage(company: company_a, feature: 'service_area_cities_limit')).to eq(1)
    end
  end

  describe '4. Service Area States Limit Atomicity' do
    it 'prevents race condition when adding service area states up to limit 1' do
      results = []
      errors = []
      barrier = Concurrent::CyclicBarrier.new(2)

      t1 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'service_area_states_limit') do
              company_a.update_columns(coverage_states: 'MG')
            end
            results << :success_1
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      t2 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'service_area_states_limit') do
              company_a.update_columns(coverage_states: 'PR')
            end
            results << :success_2
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      [t1, t2].each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(EntitlementService.usage(company: company_a, feature: 'service_area_states_limit')).to eq(1)
    end
  end

  describe '5. Product Images Limit Atomicity (Narrow Aggregate Lock on Product)' do
    it 'locks Product aggregate and enforces image limit atomically without locking entire company' do
      product = create(:product, company: company_a, name: 'Inversor Solar Conc', sku: "SKU-INV-CONC-#{SecureRandom.hex(4)}")

      results = []
      errors = []
      barrier = Concurrent::CyclicBarrier.new(2)

      t1 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'product_images_limit', target: product) do
              product.images.attach(
                io: StringIO.new('dummy-image-1-data'),
                filename: 'photo1.jpg',
                content_type: 'image/jpeg'
              )
            end
            results << :success_1
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      t2 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          begin
            EntitlementService.with_quota_lock(company: company_a, feature: 'product_images_limit', target: product) do
              product.images.attach(
                io: StringIO.new('dummy-image-2-data'),
                filename: 'photo2.jpg',
                content_type: 'image/jpeg'
              )
            end
            results << :success_2
          rescue EntitlementService::QuotaExceededError => e
            errors << e
          end
        end
      end

      [t1, t2].each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(product.reload.images.count).to eq(1)
    end
  end

  describe '6. Zero Limit and Unlimited Semantics & JSON Safety' do
    it 'strictly forbids consumption when limit is 0' do
      company_free = create(:company, name: 'Empresa Free Zero', plan: free_plan)
      expect(EntitlementService.entitled?(company: company_free, feature: 'featured_products')).to be(false)
      expect(EntitlementService.remaining(company: company_free, feature: 'featured_products')).to eq(0)

      expect {
        EntitlementService.with_quota_lock(company: company_free, feature: 'featured_products') do
          # must not run
        end
      }.to raise_error(EntitlementService::NotEntitledError)
    end

    it 'allows consumption when limit is nil/unlimited without generating Infinity or NaN' do
      company_unl = create(:company, name: 'Empresa Unlimited', plan: unlimited_plan)
      expect(EntitlementService.entitled?(company: company_unl, feature: 'featured_products')).to be(true)
      expect(EntitlementService.limit(company: company_unl, feature: 'featured_products')).to be_nil
      expect(EntitlementService.remaining(company: company_unl, feature: 'featured_products')).to be_nil

      explanation = EntitlementService.explain(company: company_unl, feature: 'featured_products')
      json = JSON.generate(explanation)
      expect(json).not_to include('Infinity')
      expect(json).not_to include('NaN')

      expect {
        EntitlementService.with_quota_lock(company: company_unl, feature: 'featured_products') do
          # Allowed
        end
      }.not_to raise_error
    end
  end

  describe '7. Tenant Isolation Under Concurrency' do
    it 'guarantees that quota usage by Company A does not reduce remaining quota for Company B' do
      product_a = create(:product, company: company_a, name: 'Painel A', sku: "SKU-TENANT-A-#{SecureRandom.hex(4)}")
      product_b = create(:product, company: company_b, name: 'Painel B', sku: "SKU-TENANT-B-#{SecureRandom.hex(4)}")

      # Company A consumes its slot
      EntitlementService.with_quota_lock(company: company_a, feature: 'featured_products') do
        product_a.update!(featured: true)
      end

      expect(EntitlementService.remaining(company: company_a, feature: 'featured_products')).to eq(0)

      # Company B still has its own 1 slot available
      expect(EntitlementService.remaining(company: company_b, feature: 'featured_products')).to eq(1)

      expect {
        EntitlementService.with_quota_lock(company: company_b, feature: 'featured_products') do
          product_b.update!(featured: true)
        end
      }.not_to raise_error

      expect(EntitlementService.remaining(company: company_b, feature: 'featured_products')).to eq(0)
    end
  end
end
