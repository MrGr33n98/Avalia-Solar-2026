require "rails_helper"

RSpec.describe Sales::Activity, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }

  it "validates activity_type and occurred_at presence" do
    activity = Sales::Activity.new(account: account, actor: owner)
    expect(activity).not_to be_valid
    expect(activity.errors[:activity_type]).to include("can't be blank")
    expect(activity.errors[:occurred_at]).to include("can't be blank")
  end

  it "creates with valid attributes" do
    activity = account.activities.create!(actor: owner, activity_type: "call", occurred_at: Time.current, subject: "Follow up")
    expect(activity).to be_persisted
    expect(activity.account).to eq(account)
  end
end
