# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewFormPolicy do
  let(:company) { create(:company) }
  let(:review_form) { ReviewForm.new(company: company, name: 'Padrão', public_title: 'Avalie', form_type: 'general') }

  describe '#event? and #channel_metrics?' do
    it 'allows an admin user to record events and view channel metrics' do
      admin = create(:user, role: 'admin')
      policy = described_class.new(admin, review_form)

      expect(policy.event?).to be(true)
      expect(policy.channel_metrics?).to be(true)
    end

    it 'denies an unrelated user from recording events on another company review form' do
      outsider = create(:user, role: 'review')
      policy = described_class.new(outsider, review_form)

      expect(policy.event?).to be(false)
      expect(policy.channel_metrics?).to be(false)
    end
  end
end

