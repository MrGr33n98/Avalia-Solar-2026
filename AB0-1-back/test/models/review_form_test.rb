require 'test_helper'

class ReviewFormTest < ActiveSupport::TestCase
  fixtures :companies

  test 'generates unique public token and default settings' do
    form = ReviewForm.create!(
      company: companies(:one),
      name: 'Instalação residencial',
      public_title: 'Avalie sua instalação',
      form_type: 'residential_solar'
    )

    assert form.token.present?
    assert_equal '/f/' + form.token, form.public_path
    assert_includes form.settings['criteria'], 'Atendimento'
  end

  test 'calculates conversion from tracked views and submitted reviews' do
    form = ReviewForm.create!(
      company: companies(:one),
      name: 'Avaliação geral',
      public_title: 'Avalie sua experiência',
      form_type: 'general'
    )
    2.times do
      form.review_form_events.create!(company: companies(:one), event_type: 'form_viewed', source: 'link')
    end

    form.reviews.create!(
      company: companies(:one),
      rating: 5,
      comment: 'Excelente atendimento',
      capture_flow_source: 'custom_review_form',
      is_legacy: true,
      form_answers: { 'Atendimento' => 5 }
    )

    assert_equal 2, form.metrics[:views]
    assert_equal 1, form.metrics[:submissions]
    assert_equal 50.0, form.metrics[:conversion_rate]
  end
end
