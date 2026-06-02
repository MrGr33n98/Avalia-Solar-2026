# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe 'analytics:sanitize_historical_pii' do
  let(:connection) { instance_double(ActiveRecord::ConnectionAdapters::AbstractAdapter) }
  let(:task) { Rake::Task['analytics:sanitize_historical_pii'] }

  before(:all) do
    Rails.application.load_tasks unless Rake::Task.task_defined?('analytics:sanitize_historical_pii')
  end

  before do
    task.reenable
    allow(ActiveRecord::Base).to receive(:connection).and_return(connection)
    allow(connection).to receive(:table_exists?).and_return(true)
    allow(connection).to receive(:quote) { |value| "'#{value}'" }
    allow(connection).to receive(:select_all) do |sql|
      column = sql.match(/SELECT id, (\w+)/)[1]
      [{ 'id' => 1, column => { 'email' => 'buyer@example.com', 'category_slug' => 'energia-solar' } }]
    end
    allow(connection).to receive(:execute)
  end

  after do
    ENV.delete('DRY_RUN')
  end

  it 'only reports changes in dry-run mode' do
    task.invoke

    expect(connection).not_to have_received(:execute)
  end

  it 'updates all historical telemetry tables only when explicitly enabled' do
    ENV['DRY_RUN'] = 'false'

    task.invoke

    expect(connection).to have_received(:execute).exactly(3).times
  end
end
