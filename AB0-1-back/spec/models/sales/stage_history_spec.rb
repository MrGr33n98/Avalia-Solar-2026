require "rails_helper"

RSpec.describe Sales::StageHistory, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }
  let(:pipeline) { Sales::Pipeline.create!(name: "B2B", key: "b2b_sh_#{SecureRandom.hex(4)}") }
  let(:prospect) { pipeline.stages.create!(name: "Prospect", key: "prospect", position: 0, probability: 10) }
  let(:contacted) { pipeline.stages.create!(name: "Contacted", key: "contacted", position: 1, probability: 20) }
  let(:opportunity) { account.opportunities.create!(name: "Deal", pipeline: pipeline, stage: prospect, owner: owner) }

  it "records stage transition" do
    history = opportunity.stage_histories.create!(from_stage: prospect, to_stage: contacted, actor: owner, entered_at: Time.current)
    expect(history).to be_persisted
    expect(history.from_stage).to eq(prospect)
    expect(history.to_stage).to eq(contacted)
  end

  it "tracks duration when left_at set" do
    entered = 2.hours.ago
    history = opportunity.stage_histories.create!(from_stage: nil, to_stage: prospect, entered_at: entered)
    history.update!(left_at: Time.current, duration_seconds: (Time.current - entered).to_i)
    expect(history.duration_seconds).to be > 0
  end
end
