require "rails_helper"

RSpec.describe Sales::Pipeline, type: :model do
  it "validates name and key presence" do
    pipeline = Sales::Pipeline.new
    expect(pipeline).not_to be_valid
    expect(pipeline.errors[:name]).to include("can't be blank")
    expect(pipeline.errors[:key]).to include("can't be blank")
  end

  it "enforces unique key" do
    Sales::Pipeline.create!(name: "First", key: "uniq_pipe_test")
    duplicate = Sales::Pipeline.new(name: "Second", key: "uniq_pipe_test")
    expect(duplicate).not_to be_valid
  end

  it "cascades destroy to stages" do
    pipeline = Sales::Pipeline.create!(name: "Temp", key: "temp_#{SecureRandom.hex(4)}")
    pipeline.stages.create!(name: "S1", key: "s1", position: 0, probability: 0)
    expect { pipeline.destroy }.to change(Sales::Stage, :count).by(-1)
  end

  it "restricts destroy when opportunities exist" do
    pipeline = Sales::Pipeline.create!(name: "Active", key: "active_#{SecureRandom.hex(4)}")
    stage = pipeline.stages.create!(name: "S1", key: "s1", position: 0, probability: 10)
    owner = create(:user, role: :admin, company: nil)
    account = Sales::Account.create!(name: "A", owner: owner)
    account.opportunities.create!(name: "D", pipeline: pipeline, stage: stage, owner: owner)

    expect { pipeline.destroy! }.to raise_error(ActiveRecord::RecordNotDestroyed)
  end
end
