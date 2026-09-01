require "rails_helper"

RSpec.describe Sales::Stage, type: :model do
  let(:pipeline) { Sales::Pipeline.create!(name: "B2B", key: "b2b_stg_#{SecureRandom.hex(4)}") }

  it "validates name, key, position presence" do
    stage = Sales::Stage.new(pipeline: pipeline)
    expect(stage).not_to be_valid
    expect(stage.errors[:name]).to include("can't be blank")
    expect(stage.errors[:key]).to include("can't be blank")
    expect(stage.errors[:position]).to include("can't be blank")
  end

  it "creates with valid attributes" do
    stage = pipeline.stages.create!(name: "Prospect", key: "prospect", position: 0, probability: 10)
    expect(stage).to be_persisted
    expect(stage.pipeline).to eq(pipeline)
  end

  it "enforces unique key per pipeline" do
    pipeline.stages.create!(name: "S1", key: "s1", position: 0, probability: 0)
    duplicate = pipeline.stages.new(name: "S1 Copy", key: "s1", position: 1, probability: 0)
    expect(duplicate).not_to be_valid
  end

  it "enforces unique position per pipeline" do
    pipeline.stages.create!(name: "S1", key: "s1", position: 0, probability: 0)
    duplicate = pipeline.stages.new(name: "S2", key: "s2", position: 0, probability: 0)
    expect(duplicate).not_to be_valid
  end
end
