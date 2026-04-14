require 'rails_helper'
require 'ostruct'

RSpec.describe User, type: :model do
  describe '.from_omniauth' do
    let(:auth_info) do
      OpenStruct.new(
        email: 'google.user@example.com',
        name: 'Google User'
      )
    end

    let(:auth) do
      OpenStruct.new(
        provider: 'google_oauth2',
        uid: '1234567890',
        info: auth_info
      )
    end

    it 'creates a confirmed active user from google oauth data' do
      expect do
        described_class.from_omniauth(auth)
      end.to change(described_class, :count).by(1)

      user = described_class.find_by(email: 'google.user@example.com')

      expect(user).to be_present
      expect(user.provider).to eq('google_oauth2')
      expect(user.uid).to eq('1234567890')
      expect(user.name).to eq('Google User')
      expect(user.terms_accepted).to be(true)
      expect(user.confirmed?).to be(true)
      expect(user.active_for_authentication?).to be(true)
    end

    it 'links an existing user by email instead of duplicating the account' do
      existing_user = create(
        :user,
        email: 'google.user@example.com',
        name: 'Existing User',
        provider: nil,
        uid: nil,
        role: :review,
        city: 'Florianópolis',
        company: nil,
        terms_accepted: true,
        status: :active
      )

      expect do
        described_class.from_omniauth(auth)
      end.not_to change(described_class, :count)

      existing_user.reload

      expect(existing_user.provider).to eq('google_oauth2')
      expect(existing_user.uid).to eq('1234567890')
      expect(existing_user.name).to eq('Existing User')
      expect(existing_user.active_for_authentication?).to be(true)
    end
  end
end
