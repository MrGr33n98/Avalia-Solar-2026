require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid when terms_accepted is true" do
    user = build(:user, terms_accepted: true)
    expect(user).to be_valid
  end

  it "is invalid when terms_accepted is false" do
    user = build(:user, terms_accepted: false)
    expect(user).not_to be_valid
    expect(user.errors[:terms_accepted]).to include("must be accepted")
  end
end
