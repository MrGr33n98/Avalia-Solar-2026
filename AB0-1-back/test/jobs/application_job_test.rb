require 'test_helper'

class ApplicationJobTest < ActiveSupport::TestCase
  test 'uses sidekiq options without including sidekiq job mixin' do
    assert_not_includes ApplicationJob.ancestors, Sidekiq::Job
    assert_respond_to ApplicationJob, :sidekiq_options
    assert_equal 5, ApplicationJob.get_sidekiq_options['retry']
    assert_equal true, ApplicationJob.get_sidekiq_options['dead']
  end
end
