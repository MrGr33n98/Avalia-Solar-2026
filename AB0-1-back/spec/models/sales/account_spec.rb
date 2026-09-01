require "rails_helper"

RSpec.describe Sales::Account, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }

  it "validates name presence" do
    account = Sales::Account.new(owner: owner, name: nil)
    expect(account).not_to be_valid
    expect(account.errors[:name]).to include("can't be blank")
  end

  it "creates with minimal attributes" do
    account = Sales::Account.create!(name: "Acme Solar", owner: owner)
    expect(account).to be_persisted
    expect(account.status).to eq("prospecting")
    expect(account.country).to eq("BR")
  end

  it "links to company optionally" do
    company = create(:company)
    account = Sales::Account.create!(name: company.name, owner: owner, company: company)
    expect(account.company).to eq(company)
  end

  it "cascades destroy to contacts and opportunities" do
    account = Sales::Account.create!(name: "Acme", owner: owner)
    account.contacts.create!(first_name: "Ana")
    pipeline = Sales::Pipeline.create!(name: "B2B", key: "b2b_acc_#{SecureRandom.hex(4)}")
    stage = pipeline.stages.create!(name: "Prospect", key: "prospect", position: 0, probability: 10)
    account.opportunities.create!(name: "Deal", pipeline: pipeline, stage: stage, owner: owner)

    expect { account.destroy }.to change(Sales::Contact, :count).by(-1)
      .and change(Sales::Opportunity, :count).by(-1)
  end
end
