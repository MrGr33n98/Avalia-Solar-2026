require 'test_helper'

class NotificationServiceTest < ActiveSupport::TestCase
  setup do
    @service = NotificationService.new
    @user = users(:one)
    @product = products(:one)
  end

  test "should create notification" do
    assert_difference '@user.notifications.count', 1 do
      @service.notify(@user, 'Test notification', 'info')
    end
  end

  test "should create notification with data" do
    notification = @service.notify(@user, 'Product updated', 'success', { product_id: @product.id })
    
    assert_equal 'Product updated', notification.message
    assert_equal 'success', notification.notification_type
    assert_equal @product.id, notification.data['product_id']
  end

  test "should send push notification" do
    # Mock do serviço de push notification
    NotificationService.any_instance.stubs(:send_push).returns(true)
    
    result = @service.send_push_notification(@user, 'Test message')
    assert result
  end

  test "should mark notification as read" do
    notification = @service.notify(@user, 'Test', 'info')
    
    @service.mark_as_read(notification)
    assert notification.reload.read?
  end

  test "should mark all notifications as read" do
    3.times { @service.notify(@user, 'Test', 'info') }
    
    @service.mark_all_as_read(@user)
    assert @user.notifications.unread.count.zero?
  end

  test "should delete old notifications" do
    old_notification = @service.notify(@user, 'Old', 'info')
    old_notification.update(created_at: 31.days.ago)
    
    @service.cleanup_old_notifications(30.days)
    assert_not Notification.exists?(old_notification.id)
  end

  test "should get unread count" do
    3.times { @service.notify(@user, 'Test', 'info') }
    
    count = @service.unread_count(@user)
    assert_equal 3, count
  end

  test "should broadcast notification" do
    # Test broadcast functionality
    assert_nothing_raised do
      @service.broadcast_notification(@user, 'Broadcast test')
    end
  end

  test "should handle notification preferences" do
    @user.update(notification_preferences: { email: false })
    
    result = @service.should_send_email?(@user)
    assert_not result
  end

  test "should batch create notifications" do
    users = [@user, users(:two)]
    
    assert_difference 'Notification.count', users.count do
      @service.notify_batch(users, 'Batch message', 'info')
    end
  end
end
