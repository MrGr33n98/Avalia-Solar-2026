require "rails_helper"

RSpec.describe Sales::Contact, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }

  it "validates first_name presence" do
    contact = Sales::Contact.new(account: account, first_name: nil)
    expect(contact).not_to be_valid
    expect(contact.errors[:first_name]).to include("can't be blank")
  end

  it "creates with minimal attributes" do
    contact = account.contacts.create!(first_name: "Carlos")
    expect(contact).to be_persisted
    expect(contact.account).to eq(account)
  end

  it "nullifies opportunities on destroy" do
    contact = account.contacts.create!(first_name: "Ana")
    pipeline = Sales::Pipeline.create!(name: "B2B", key: "b2b_ct_#{SecureRandom.hex(4)}")
    stage = pipeline.stages.create!(name: "P", key: "p", position: 0, probability: 10)
    opp = account.opportunities.create!(name: "Deal", pipeline: pipeline, stage: stage, owner: owner, primary_contact: contact)

    contact.destroy
    expect(opp.reload.primary_contact_id).to be_nil
  end
end
