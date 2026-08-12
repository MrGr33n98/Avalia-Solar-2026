# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::RetentionPolicy do
  it 'identifica registro expirado' do
    expect(described_class.expired?(:chat_message, created_at: 91.days.ago)).to be(true)
  end

  it 'lista campos PII' do
    expect(described_class::PII_FIELDS).to include('name', 'phone', 'email', 'attachments')
  end
end
