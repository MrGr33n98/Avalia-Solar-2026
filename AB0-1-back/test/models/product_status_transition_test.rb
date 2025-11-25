require 'test_helper'

class ProductStatusTransitionTest < ActiveSupport::TestCase
  def setup
    @company = Company.create!(name: 'X', description: 'Y')
    @product = Product.create!(name: 'P1', price: 10, company: @company, status: 'draft')
  end

  test 'allows draft -> active' do
    @product.update!(status: 'active')
    assert @product.active_status?
  end

  test 'prevents disabled -> active direct transition' do
    @product.update!(status: 'disabled')
    @product.status = 'active'
    refute @product.valid?
    assert_includes @product.errors[:status], 'não pode voltar de disabled direto para active (use draft -> active)'
  end

  test 'allows disabled -> draft -> active sequence' do
    @product.update!(status: 'disabled')
    @product.update!(status: 'draft')
    @product.update!(status: 'active')
    assert @product.active_status?
  end
end
