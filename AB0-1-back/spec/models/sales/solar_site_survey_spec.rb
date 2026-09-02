require 'rails_helper'

RSpec.describe Sales::SolarSiteSurvey do
  it 'aceita status de vistoria suportado' do
    survey = described_class.new(status: 'completed')
    expect(survey.tap(&:valid?).errors[:status]).to be_empty
  end

  it 'rejeita status desconhecido' do
    survey = described_class.new(status: 'unknown')
    survey.valid?
    expect(survey.errors[:status]).not_to be_empty
  end
end
