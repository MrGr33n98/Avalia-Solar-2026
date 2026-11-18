# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe 'gamification:evaluate_all', type: :task do
  before :all do
    Rake.application.rake_require('tasks/gamification')
    Rake::Task.define_task(:environment)
  end

  before do
    Rake::Task['gamification:evaluate_all'].reenable
  end

  let!(:user) { create(:user) }
  let!(:badge) { create(:achievement_badge, slug: 'first_review_approved', points_xp: 50, active: true) }

  it 'executes dry run without creating user achievements' do
    expect do
      Rake::Task['gamification:evaluate_all'].invoke('true')
    end.not_to change(UserAchievement, :count)
  end

  it 'executes live run and invokes EvaluateAchievementsService' do
    expect(Gamification::EvaluateAchievementsService).to receive(:call)
      .with(user_id: user.id, trigger_cause: 'rake_backfill')
      .and_call_original

    Rake::Task['gamification:evaluate_all'].invoke('false')
  end
end
