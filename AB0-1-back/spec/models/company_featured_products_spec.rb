require 'rails_helper'

RSpec.describe Company, type: :model do
  describe '#featured_products_for_public' do
    let(:plan) { create(:plan, tier: 'pro', price: 99.0, status: 'active') }
    let(:company) { create(:company, plan: plan, plan_status: 'active') }
    let!(:product1) do
      create(:product, name: 'Inversor Solar 5kW', status: 'active', featured: true)
    end
    let!(:product2) do
      create(:product, name: 'Painel Solar 450W', status: 'active', featured: true)
    end
    let!(:product3) do
      create(:product, name: 'Bateria 10kWh', status: 'active', featured: false)
    end

    context 'quando a empresa tem plano pago' do
      context 'e produtos no catálogo (relação canônica)' do
        before do
          create(:company_product, company: company, product: product1)
          create(:company_product, company: company, product: product2)
          create(:company_product, company: company, product: product3)
        end

        it 'retorna apenas produtos marcados como featured' do
          result = company.featured_products_for_public
          expect(result.count).to eq(2)
        end

        it 'não levanta NoMethodError' do
          expect { company.featured_products_for_public }.not_to raise_error
        end

        it 'retorna payload com campos corretos' do
          result = company.featured_products_for_public.first
          
          expect(result).to have_key(:id)
          expect(result).to have_key(:slug)
          expect(result).to have_key(:name)
          expect(result).to have_key(:short_description)
          expect(result).to have_key(:image_url)
          expect(result).to have_key(:price_mode)
        end

        it 'gera slug no formato {id}-{name-parameterized}' do
          result = company.featured_products_for_public.first
          
          expect(result[:slug]).to match(/^\d+-[\w-]+$/)
          expect(result[:slug]).to start_with(result[:id].to_s)
        end

        it 'respeita o limite do entitlement' do
          # Adicionar mais produtos featured
          (1..5).each do |i|
            product = create(:product, name: "Produto #{i}", status: 'active', featured: true)
            create(:company_product, company: company, product: product)
          end

          result = company.featured_products_for_public
          expect(result.count).to be <= 3
        end
      end

      context 'e produtos legacy (sem catálogo)' do
        before do
          product1.update(company: company)
          product2.update(company: company)
          product3.update(company: company)
        end

        it 'usa fallback para produtos legacy' do
          result = company.featured_products_for_public
          expect(result.count).to eq(2)
        end

        it 'não levanta NoMethodError no fallback' do
          expect { company.featured_products_for_public }.not_to raise_error
        end
      end
    end

    context 'quando a empresa não tem plano pago' do
      let(:free_company) { create(:company, plan: nil) }

      it 'retorna array vazio' do
        result = free_company.featured_products_for_public
        expect(result).to eq([])
      end
    end

    context 'quando não há produtos featured' do
      before do
        product1.update(featured: false)
        product2.update(featured: false)
        create(:company_product, company: company, product: product1)
        create(:company_product, company: company, product: product2)
      end

      it 'retorna array vazio' do
        result = company.featured_products_for_public
        expect(result).to eq([])
      end
    end
  end

  describe '#featured_product_payload' do
    let(:product) { create(:product, name: 'Inversor Solar 10kW', status: 'active') }
    let(:company) { create(:company) }

    it 'gera slug válido mesmo que Product não tenha coluna slug' do
      payload = company.send(:featured_product_payload, product)
      
      expect(payload[:slug]).to be_present
      expect(payload[:slug]).to include(product.id.to_s)
      expect(payload[:slug]).to include('inversor-solar')
    end

    it 'não acessa product.slug diretamente' do
      # Product não tem método/coluna slug
      expect(product).not_to respond_to(:slug)
      
      # Mas featured_product_payload deve funcionar
      expect { company.send(:featured_product_payload, product) }.not_to raise_error
    end
  end
end
