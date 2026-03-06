# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Notification, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:notifiable).optional }
  end

  describe 'validations' do
    it { should validate_presence_of(:notification_type) }
    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:delivery_channels) }
    
    it 'validates notification_type inclusion' do
      notification = build(:notification, notification_type: 'invalid_type')
      expect(notification).not_to be_valid
      expect(notification.errors[:notification_type]).to include('is not included in the list')
    end
  end

  describe 'scopes' do
    let(:user) { create(:user) }
    let!(:unread1) { create(:notification, user: user, read_at: nil) }
    let!(:unread2) { create(:notification, user: user, read_at: nil) }
    let!(:read1) { create(:notification, user: user, read_at: Time.current) }

    it 'filters unread notifications' do
      expect(Notification.unread.count).to eq(2)
    end

    it 'filters read notifications' do
      expect(Notification.read.count).to eq(1)
    end

    it 'orders by recent' do
      expect(Notification.recent.first).to eq(read1)
    end
  end

  describe '#read!' do
    let(:notification) { create(:notification, read_at: nil) }

    it 'marks notification as read' do
      notification.read!
      expect(notification.reload.read?).to be true
    end

    it 'sets read_at timestamp' do
      notification.read!
      expect(notification.reload.read_at).to be_present
    end
  end

  describe '.mark_all_as_read' do
    let(:user) { create(:user) }
    let!(:notifications) { create_list(:notification, 3, user: user, read_at: nil) }

    it 'marks all user notifications as read' do
      Notification.mark_all_as_read(user)
      expect(user.notifications.unread.count).to eq(0)
    end
  end

  describe 'notification types' do
    it 'includes new_review type' do
      notification = create(:notification, :new_review)
      expect(notification.notification_type).to eq('new_review')
    end

    it 'includes new_lead type' do
      notification = create(:notification, :new_lead)
      expect(notification.notification_type).to eq('new_lead')
    end

    it 'includes reply_received type' do
      notification = create(:notification, :reply_received)
      expect(notification.notification_type).to eq('reply_received')
    end

    it 'includes status_update type' do
      notification = create(:notification, :status_update)
      expect(notification.notification_type).to eq('status_update')
    end
  end
end
