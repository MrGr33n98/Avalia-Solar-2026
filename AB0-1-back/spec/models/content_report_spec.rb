# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ContentReport, type: :model do
  describe 'associations' do
    it { should belong_to(:reportable) }
    it { should belong_to(:reporter).class_name('User') }
    it { should belong_to(:resolved_by).class_name('User').optional }
  end

  describe 'validations' do
    it { should validate_presence_of(:reason) }
    it { should validate_presence_of(:status) }
    
    it 'validates status inclusion' do
      report = ContentReport.new(status: 'invalid')
      report.valid?
      expect(report.errors[:status]).to include('não está incluído na lista')
    end
  end
end
