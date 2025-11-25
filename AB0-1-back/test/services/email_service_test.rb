require 'test_helper'

class EmailServiceTest < ActiveSupport::TestCase
  setup do
    @service = EmailService.new
    @user = users(:one)
  end

  test "should send welcome email" do
    assert_difference 'ActionMailer::Base.deliveries.size', 1 do
      @service.send_welcome_email(@user)
    end
  end

  test "should send password reset email" do
    assert_difference 'ActionMailer::Base.deliveries.size', 1 do
      @service.send_password_reset_email(@user)
    end
  end

  test "should send notification email" do
    assert_difference 'ActionMailer::Base.deliveries.size', 1 do
      @service.send_notification_email(@user, 'Test Subject', 'Test Body')
    end
  end

  test "should handle email delivery errors gracefully" do
    # Stub para simular falha
    EmailService.any_instance.stubs(:deliver_email).raises(StandardError.new('Email error'))
    
    assert_nothing_raised do
      @service.send_welcome_email(@user)
    end
  end

  test "should validate email format" do
    assert @service.valid_email?('test@example.com')
    assert_not @service.valid_email?('invalid-email')
  end

  test "should send bulk emails" do
    users = [@user, users(:two)]
    
    assert_difference 'ActionMailer::Base.deliveries.size', users.count do
      @service.send_bulk_emails(users, 'Test Subject', 'Test Body')
    end
  end

  test "should queue emails for later delivery" do
    assert @service.queue_email(@user, 'Test Subject', 'Test Body')
  end

  test "should not send email to user with no email" do
    user = User.new(name: 'Test User')
    
    assert_no_difference 'ActionMailer::Base.deliveries.size' do
      @service.send_welcome_email(user)
    end
  end
end
