require 'rails_helper'

RSpec.describe 'reputação orgânica', type: :service do
  let(:company) { create(:company, rating_avg: 0, rating_count: 0) }

  def recalculate
    Reviews::AggregationService.new(company).recalculate!
    company.reload
  end

  it 'exclui estados não aprovados do agregado e do cache' do
    %i[pending rejected in_analysis flagged contested].each do |status|
      create(:review, company: company, status: status, rating: 1)
    end

    recalculate

    expect(company.review_aggregates.find_by(category_id: nil).total_reviews).to eq(0)
    expect(company.rating_avg).to eq(0.0)
    expect(company.rating_count).to eq(0)
  end

  it 'inclui somente approved e mantém aggregate/cache equivalentes' do
    create(:review, company: company, status: :approved, rating: 5)
    create(:review, company: company, status: :approved, rating: 3)

    recalculate
    aggregate = company.review_aggregates.find_by(category_id: nil)

    expect(aggregate.total_reviews).to eq(2)
    expect(company.rating_avg).to eq(aggregate.average_rating)
    expect(company.rating_count).to eq(aggregate.total_reviews)
  end

  it 'não altera reputação quando approved vira featured' do
    review = create(:review, company: company, status: :approved, rating: 4)
    recalculate
    before = company.review_aggregates.find_by(category_id: nil).attributes.slice('average_rating', 'total_reviews')

    review.update!(featured: true)
    recalculate
    after = company.review_aggregates.find_by(category_id: nil).attributes.slice('average_rating', 'total_reviews')

    expect(after).to eq(before)
    expect(company.rating_avg).to eq(before['average_rating'])
    expect(company.rating_count).to eq(before['total_reviews'])
  end

  it 'não altera reputação ao verificar empresa' do
    create(:review, company: company, status: :approved, rating: 4)
    recalculate
    before = company.attributes.slice('rating_avg', 'rating_count')

    company.update!(verified: true)

    expect(company.reload.attributes.slice('rating_avg', 'rating_count')).to eq(before)
    expect(company.review_aggregates.find_by(category_id: nil).total_reviews).to eq(1)
  end
end
