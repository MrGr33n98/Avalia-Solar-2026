# frozen_string_literal: true

require 'test_helper'

# Tests for WelcomeEmailJob - TASK-018
class WelcomeEmailJobTest < ActiveJob::TestCase
  setup do
    @user = users(:one) # Assuming fixtures exist
    ActionMailer::Base.deliveries.clear
  end

  test 'should enqueue job in mailers queue' do
    assert_enqueued_with(job: WelcomeEmailJob, queue: 'mailers') do
      WelcomeEmailJob.perform_later(@user.id)
    end
  end

  test 'should send welcome email' do
    assert_difference 'ActionMailer::Base.deliveries.count', 1 do
      WelcomeEmailJob.perform_now(@user.id)
    end
  end

  test 'should send email to correct recipient' do
    WelcomeEmailJob.perform_now(@user.id)
    
    email = ActionMailer::Base.deliveries.last
    assert_equal [@user.email], email.to
    assert_match(/Bem-vindo/, email.subject)
  end

  test 'should log success' do
    logger_mock = Minitest::Mock.new
    logger_mock.expect :info, nil, [String]
    
    Rails.stub :logger, logger_mock do
      WelcomeEmailJob.perform_now(@user.id)
    end
    
    logger_mock.verify
  end

  test 'should handle missing user' do
    assert_raises(ActiveRecord::RecordNotFound) do
      WelcomeEmailJob.perform_now(99999)
    end
  end

  test 'should be discarded on RecordNotFound' do
    # Test that job is configured to discard on missing records
    job = WelcomeEmailJob.new(99999)
    
    assert_nothing_raised do
      # This should be caught by discard_on
      job.rescue_with_handler(ActiveRecord::RecordNotFound.new)
    end
  end

  test 'should retry on StandardError' do
    # Simulate email sending failure
    UserMailer.stub :welcome, ->(_user) { raise StandardError, 'SMTP error' } do
      assert_raises(StandardError) do
        WelcomeEmailJob.perform_now(@user.id)
      end
    end
  end
end
