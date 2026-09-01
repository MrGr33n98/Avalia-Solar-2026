require "rails_helper"

RSpec.describe Sales::Qualification, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }
  let(:pipeline) { Sales::Pipeline.create!(name: "B2B", key: "b2b_qual_#{SecureRandom.hex(4)}") }
  let(:stage) { pipeline.stages.create!(name: "P", key: "p", position: 0, probability: 10) }
  let(:opportunity) { account.opportunities.create!(name: "Deal", pipeline: pipeline, stage: stage, owner: owner) }

  it "creates SPIN qualification" do
    q = opportunity.create_qualification!(situation: "Precisa de energia solar", problem: "Conta alta",
                                           implication: "Prejuízo mensal", need_payoff: "Economia de 80%")
    expect(q).to be_persisted
    expect(q.situation).to eq("Precisa de energia solar")
  end

  it "creates BANT qualification" do
    q = opportunity.create_qualification!(budget: "R$50k", authority: "Diretor", need: "Reduzir custo", timeline: "Q1 2026")
    expect(q).to be_persisted
    expect(q.budget).to eq("R$50k")
  end

  it "is unique per opportunity" do
    opportunity.create_qualification!(situation: "S")
    expect {
      Sales::Qualification.create!(opportunity: opportunity, situation: "S2")
    }.to raise_error(ActiveRecord::RecordNotUnique)
  end
end
