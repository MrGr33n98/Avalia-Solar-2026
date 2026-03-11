require 'rails_helper'

RSpec.describe BuyerIntentActivity, type: :model do
  let(:company) { create(:company) }

  let(:base_attributes) do
    {
      company: company,
      anonymous_id: 'anon-123',
      session_id: 'session-123',
      signal_type: 'hover_intent',
      signal_category: 'contact_intent',
      page_path: '/companies/empresa-teste',
      tracked_at: Time.current
    }
  end

  describe 'validations' do
    it 'is valid with the minimum required attributes' do
      activity = described_class.new(base_attributes)

      expect(activity).to be_valid
    end

    it 'requires a signal_type from the allowlist' do
      activity = described_class.new(base_attributes.merge(signal_type: 'invalid_signal'))

      expect(activity).not_to be_valid
      expect(activity.errors[:signal_type]).to be_present
    end

    it 'requires a signal_category from the allowlist' do
      activity = described_class.new(base_attributes.merge(signal_category: 'invalid_category'))

      expect(activity).not_to be_valid
      expect(activity.errors[:signal_category]).to be_present
    end

    it 'assigns the default intent weight from the signal type on create' do
      activity = described_class.create!(base_attributes.merge(signal_type: 'whatsapp_hover', intent_weight: nil))

      expect(activity.intent_weight).to eq(7)
    end
  end

  describe 'associations' do
    it 'belongs to a company' do
      association = described_class.reflect_on_association(:company)

      expect(association&.macro).to eq(:belongs_to)
    end

    it 'belongs to a user optionally' do
      association = described_class.reflect_on_association(:user)

      expect(association&.macro).to eq(:belongs_to)
      expect(association&.options[:optional]).to be(true)
    end
  end

  describe 'scopes' do
    it '.hot_signals returns signals with weight >= 5' do
      cold_signal = described_class.create!(base_attributes.merge(signal_type: 'hover_intent', intent_weight: 2))
      hot_signal = described_class.create!(base_attributes.merge(signal_type: 'pricing_interaction', intent_weight: 8))

      expect(described_class.hot_signals).to contain_exactly(hot_signal)
      expect(described_class.hot_signals).not_to include(cold_signal)
    end
  end
end
