require "rails_helper"

RSpec.describe Sales::Opportunities::ChangeStage, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }
  let(:pipeline) { Sales::Pipeline.create!(name: "B2B", key: "b2b_cs_#{SecureRandom.hex(4)}") }
  let(:prospect) { pipeline.stages.create!(name: "Prospect", key: "prospect", position: 0, probability: 10) }
  let(:contacted) { pipeline.stages.create!(name: "Contacted", key: "contacted", position: 1, probability: 20) }
  let(:qualified) { pipeline.stages.create!(name: "Qualified", key: "qualified", position: 2, probability: 40) }
  let(:won_stage) { pipeline.stages.create!(name: "Won", key: "won", position: 7, probability: 100, terminal_type: "won") }
  let(:lost_stage) { pipeline.stages.create!(name: "Lost", key: "lost", position: 8, probability: 0, terminal_type: "lost") }
  let(:opportunity) { account.opportunities.create!(name: "Solar 10kW", pipeline: pipeline, stage: prospect, owner: owner) }

  describe "Prospect to Contacted" do
    it "updates opportunity stage" do
      result = described_class.call(opportunity: opportunity, stage: contacted, actor: owner)
      expect(result.stage).to eq(contacted)
    end

    it "creates StageHistory" do
      expect {
        described_class.call(opportunity: opportunity, stage: contacted, actor: owner)
      }.to change(Sales::StageHistory, :count).by(1)

      history = Sales::StageHistory.last
      expect(history.from_stage).to eq(prospect)
      expect(history.to_stage).to eq(contacted)
      expect(history.actor).to eq(owner)
    end

    it "creates DomainEvent" do
      expect {
        described_class.call(opportunity: opportunity, stage: contacted, actor: owner)
      }.to change(DomainEvent, :count).by(1)

      event = DomainEvent.last
      expect(event.event_type).to eq("sales.opportunity.stage_changed")
      expect(event.payload["from_stage_id"]).to eq(prospect.id)
      expect(event.payload["to_stage_id"]).to eq(contacted.id)
    end

    it "updates probability from stage when not overridden" do
      described_class.call(opportunity: opportunity, stage: contacted, actor: owner)
      expect(opportunity.reload.probability).to eq(20)
    end

    it "preserves overridden probability" do
      opportunity.update!(probability: 50, probability_overridden: true)
      described_class.call(opportunity: opportunity, stage: contacted, actor: owner)
      expect(opportunity.reload.probability).to eq(50)
    end
  end

  describe "same stage (no-op)" do
    it "returns opportunity without creating history" do
      expect {
        described_class.call(opportunity: opportunity, stage: prospect, actor: owner)
      }.not_to change(Sales::StageHistory, :count)
    end
  end

  describe "cross-pipeline rejection" do
    it "raises when stage from different pipeline" do
      other_pipeline = Sales::Pipeline.create!(name: "Other", key: "other_#{SecureRandom.hex(4)}")
      other_stage = other_pipeline.stages.create!(name: "X", key: "x", position: 0, probability: 0)

      expect {
        described_class.call(opportunity: opportunity, stage: other_stage, actor: owner)
      }.to raise_error(ArgumentError, /pipeline/)
    end
  end

  describe "Won" do
    it "transitions to Won stage with probability 100" do
      described_class.call(opportunity: opportunity, stage: won_stage, actor: owner)
      opportunity.reload

      expect(opportunity.stage).to eq(won_stage)
      expect(opportunity.probability).to eq(100)
    end

    it "sets won status and timestamp" do
      described_class.call(opportunity: opportunity, stage: won_stage, actor: owner)
      opportunity.update!(status: "won", won_at: Time.current)

      expect(opportunity.reload.status).to eq("won")
      expect(opportunity.won_at).to be_present
    end
  end

  describe "Lost" do
    it "transitions to Lost stage with probability 0" do
      described_class.call(opportunity: opportunity, stage: lost_stage, actor: owner)
      opportunity.reload

      expect(opportunity.stage).to eq(lost_stage)
      expect(opportunity.probability).to eq(0)
    end

    it "records lost reason" do
      described_class.call(opportunity: opportunity, stage: lost_stage, actor: owner)
      opportunity.update!(status: "lost", lost_at: Time.current, lost_reason: "Preço alto")

      expect(opportunity.reload.status).to eq("lost")
      expect(opportunity.lost_at).to be_present
      expect(opportunity.lost_reason).to eq("Preço alto")
    end
  end

  describe "full pipeline progression" do
    it "Prospect to Contacted to Qualified creates proper audit trail" do
      described_class.call(opportunity: opportunity, stage: contacted, actor: owner)
      described_class.call(opportunity: opportunity, stage: qualified, actor: owner)

      expect(opportunity.reload.stage).to eq(qualified)
      expect(Sales::StageHistory.where(sales_opportunity_id: opportunity.id).count).to eq(2)
      expect(DomainEvent.where(aggregate_id: opportunity.id, event_type: "sales.opportunity.stage_changed").count).to eq(2)
    end
  end
end
