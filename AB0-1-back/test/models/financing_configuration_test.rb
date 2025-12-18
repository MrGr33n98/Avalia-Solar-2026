require "test_helper"

class FinancingConfigurationTest < ActiveSupport::TestCase
  def setup
    @config = FinancingConfiguration.new(
      name: "Financiamento Padrão",
      financing_type: :sac,
      interest_rate_fixed: 1.5,
      interest_rate_variable: 0.5,
      grace_period_days: 30,
      min_installments: 1,
      max_installments: 60,
      min_amount: 1000.0,
      max_amount: 50000.0,
      active: true
    )
  end

  test "should be valid" do
    assert @config.valid?
  end

  test "should require name" do
    @config.name = nil
    assert_not @config.valid?
  end

  test "should validate financing_type presence" do
    @config.financing_type = nil
    assert_not @config.valid?
  end

  test "should validate positive numeric values" do
    @config.interest_rate_fixed = -1
    assert_not @config.valid?

    @config.grace_period_days = -5
    assert_not @config.valid?

    @config.min_amount = -100
    assert_not @config.valid?
  end

  test "max installments should be greater than or equal to min" do
    @config.min_installments = 12
    @config.max_installments = 6
    assert_not @config.valid?
    assert_includes @config.errors[:max_installments], "deve ser maior ou igual ao mínimo de parcelas"
  end

  test "max amount should be greater than or equal to min" do
    @config.min_amount = 5000
    @config.max_amount = 1000
    assert_not @config.valid?
    assert_includes @config.errors[:max_amount], "deve ser maior ou igual ao valor mínimo"
  end

  test "should calculate grace period conversions" do
    @config.grace_period_days = 60
    assert_equal 2.0, @config.grace_period_months
    
    @config.grace_period_days = 365
    assert_equal 1.0, @config.grace_period_years
  end

  test "should have versioning enabled" do
    assert_difference 'PaperTrail::Version.count', 1 do
      @config.save
    end
    
    assert_difference 'PaperTrail::Version.count', 1 do
      @config.update(name: "Novo Nome")
    end
  end
end
