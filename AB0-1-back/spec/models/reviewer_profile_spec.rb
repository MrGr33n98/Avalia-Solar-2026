# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewerProfile, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe 'validations' do
    it { should validate_length_of(:bio).is_at_most(2000) }
    it { should validate_length_of(:linkedin_url).is_at_most(500) }
    it { should validate_length_of(:instagram_url).is_at_most(500) }
    it { should validate_length_of(:website_url).is_at_most(500) }
  end
end
