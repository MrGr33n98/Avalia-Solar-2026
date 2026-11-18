# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe 'gamification:evaluate_all', type: :task do
  let(:task) { Rake::Task['gamification:evaluate_all'] }

  before(:all) do
    Rails.application.load_tasks unless Rake::Task.task_defined?('gamification:evaluate_all')
  end

  before do
    task.reenable
  end

  let!(:user) { create(:user) }
  let!(:badge) { create(:achievement_badge, slug: 'first_review_approved', points_xp: 50, active: true) }

  it 'executes dry run without creating user achievements' do
    expect do
      task.invoke('true')
    end.not_to change(UserAchievement, :count)
  end

  it 'executes live run and invokes EvaluateAchievementsService' do
    expect(Gamification::EvaluateAchievementsService).to receive(:call)
      .with(user_id: user.id, trigger_cause: 'rake_backfill')
      .at_least(:once)
      .and_call_original

    task.invoke('false')
  end
end
