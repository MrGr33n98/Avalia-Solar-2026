require "rails_helper"

RSpec.describe Sales::Opportunity, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }
  let(:pipeline) { Sales::Pipeline.create!(name: "B2B", key: "b2b_opp_#{SecureRandom.hex(4)}") }
  let(:prospect) { pipeline.stages.create!(name: "Prospect", key: "prospect", position: 0, probability: 10) }

  it "validates name and status presence" do
    opp = Sales::Opportunity.new(account: account, pipeline: pipeline, stage: prospect, owner: owner)
    expect(opp).not_to be_valid
    expect(opp.errors[:name]).to include("can't be blank")
  end

  it "creates with minimal attributes" do
    opp = account.opportunities.create!(name: "Solar 10kW", pipeline: pipeline, stage: prospect, owner: owner)
    expect(opp).to be_persisted
    expect(opp.status).to eq("open")
    expect(opp.probability).to eq(0)
    expect(opp.value_cents).to eq(0)
  end

  it "scopes open opportunities" do
    account.opportunities.create!(name: "Open", pipeline: pipeline, stage: prospect, owner: owner)
    opp2 = account.opportunities.create!(name: "Closed", pipeline: pipeline, stage: prospect, owner: owner, status: "won")

    expect(Sales::Opportunity.open.count).to eq(1)
    expect(Sales::Opportunity.open.first.name).to eq("Open")
  end

  it "cascades destroy to stage_histories, activities, tasks, qualification" do
    opp = account.opportunities.create!(name: "D", pipeline: pipeline, stage: prospect, owner: owner)
    opp.stage_histories.create!(from_stage: nil, to_stage: prospect, entered_at: Time.current)
    opp.activities.create!(account: account, actor: owner, activity_type: "call", occurred_at: Time.current)
    opp.tasks.create!(account: account, owner: owner, task_type: "follow_up", title: "Call", status: "pending")
    opp.create_qualification!(situation: "S")

    expect { opp.destroy }.to change(Sales::StageHistory, :count).by(-1)
      .and change(Sales::Activity, :count).by(-1)
      .and change(Sales::Task, :count).by(-1)
      .and change(Sales::Qualification, :count).by(-1)
  end
end
