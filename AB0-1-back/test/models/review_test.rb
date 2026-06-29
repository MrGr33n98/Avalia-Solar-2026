require 'test_helper'

class ReviewTest < ActiveSupport::TestCase
  setup do
    @company = Company.create!(
      name: "WEG Solar",
      status: "pending",
      segment: "installer",
      description: "WEG Solar é líder em soluções de energia solar fotovoltaica."
    )
    @user = User.create!(
      email: "test_reviewer@avaliasolar.com.br",
      password: "Password123!",
      role: "company_user",
      name: "João Silva",
      city: "Florianópolis",
      terms_accepted: true
    )
  end

  test "should be valid with a proper nps_score and sentiment" do
    review = Review.new(
      company: @company,
      user: @user,
      rating: 5,
      comment: "Instalação incrível e profissional!",
      capture_flow_source: "qr_code_form",
      nps_score: 10,
      sentiment: "positive",
      category_id: 1 # Ajuste opcional dependendo do fixture, mas vamos deixar simples
    )
    # Permite pular category_id se is_legacy for true
    review.is_legacy = true
    assert review.valid?, review.errors.full_messages.join(", ")
  end

  test "should validate nps_score ranges" do
    review = Review.new(
      company: @company,
      user: @user,
      rating: 5,
      comment: "Excelente!",
      capture_flow_source: "qr_code_form",
      is_legacy: true
    )
    
    review.nps_score = 11
    assert_not review.valid?
    assert_includes review.errors[:nps_score], "is not included in the list"

    review.nps_score = -1
    assert_not review.valid?

    review.nps_score = 5
    assert review.valid?
  end

  test "should validate sentiment inclusion" do
    review = Review.new(
      company: @company,
      user: @user,
      rating: 5,
      comment: "Excelente!",
      capture_flow_source: "qr_code_form",
      is_legacy: true
    )
    
    review.sentiment = "super_happy"
    assert_not review.valid?
    assert_includes review.errors[:sentiment], "is not included in the list"

    review.sentiment = "positive"
    assert review.valid?
  end

  test "should calculate proper nps_category" do
    review = Review.new(nps_score: 10)
    assert_equal :promoter, review.nps_category

    review.nps_score = 8
    assert_equal :passive, review.nps_category

    review.nps_score = 5
    assert_equal :detractor, review.nps_category

    review.nps_score = nil
    assert_nil review.nps_category
  end
end
