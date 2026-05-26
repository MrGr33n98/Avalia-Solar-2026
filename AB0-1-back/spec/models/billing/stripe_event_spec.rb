require 'rails_helper'

RSpec.describe Billing::StripeEvent, type: :model do
  describe 'Validations' do
    it 'requires stripe_event_id' do
      event = described_class.new(stripe_event_id: nil, event_type: 'evt', processing_status: 'success', processed_at: Time.current)
      expect(event).not_to be_valid
      expect(event.errors[:stripe_event_id]).to include("can't be blank")
    end

    it 'requires unique stripe_event_id' do
      described_class.create!(stripe_event_id: 'evt_dup', event_type: 'evt', processing_status: 'success', processed_at: Time.current)
      event = described_class.new(stripe_event_id: 'evt_dup', event_type: 'evt', processing_status: 'success', processed_at: Time.current)
      expect(event).not_to be_valid
      expect(event.errors[:stripe_event_id]).to include("has already been taken")
    end

    it 'requires event_type' do
      event = described_class.new(stripe_event_id: 'evt_1', event_type: nil, processing_status: 'success', processed_at: Time.current)
      expect(event).not_to be_valid
      expect(event.errors[:event_type]).to include("can't be blank")
    end

    it 'requires processing_status' do
      event = described_class.new(stripe_event_id: 'evt_1', event_type: 'evt', processing_status: nil, processed_at: Time.current)
      expect(event).not_to be_valid
      expect(event.errors[:processing_status]).to include("can't be blank")
    end

    it 'requires processing_status to be in valid states' do
      event = described_class.new(stripe_event_id: 'evt_1', event_type: 'evt', processing_status: 'invalid_status', processed_at: Time.current)
      expect(event).not_to be_valid
      expect(event.errors[:processing_status]).to include("is not included in the list")
    end

    it 'requires processed_at' do
      event = described_class.new(stripe_event_id: 'evt_1', event_type: 'evt', processing_status: 'success', processed_at: nil)
      expect(event).not_to be_valid
      expect(event.errors[:processed_at]).to include("can't be blank")
    end

    it 'is valid with correct attributes' do
      event = described_class.new(stripe_event_id: 'evt_ok', event_type: 'evt', processing_status: 'success', processed_at: Time.current)
      expect(event).to be_valid
    end
  end

  describe 'Scopes' do
    let!(:success_event) do
      described_class.create!(
        stripe_event_id: 'evt_success',
        event_type: 'invoice.paid',
        processing_status: 'success',
        processed_at: Time.current
      )
    end

    let!(:failed_event) do
      described_class.create!(
        stripe_event_id: 'evt_failed',
        event_type: 'invoice.payment_failed',
        processing_status: 'failed',
        processed_at: Time.current
      )
    end

    let!(:processing_event) do
      described_class.create!(
        stripe_event_id: 'evt_processing',
        event_type: 'customer.subscription.created',
        processing_status: 'processing',
        processed_at: Time.current
      )
    end

    describe '.success' do
      it 'retorna apenas eventos com processamento com sucesso' do
        expect(described_class.success).to contain_exactly(success_event)
      end
    end

    describe '.failed' do
      it 'retorna apenas eventos com falha no processamento' do
        expect(described_class.failed).to contain_exactly(failed_event)
      end
    end
  end
end
