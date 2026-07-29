require_relative 'config/environment'

# Dummy objects
class DummyCompany
  def name; "WEG"; end
end

class DummyUser
  def name; "Matheus"; end
end

class DummyReview
  def id; 999; end
  def rating; 3.0; end
  def company; DummyCompany.new; end
  def user; DummyUser.new; end
  def metadata; {}; end
  def comment; "excelente, esse produto tem um projeto muito bem avaliado"; end
  def created_at; Time.now; end
end

review = DummyReview.new
puts "Testing slack notification payload generation..."
begin
  SlackNotificationService.notify_review(review)
  puts "Payload generation works (or at least didn't crash)."
rescue => e
  puts "Error: #{e.class} - #{e.message}"
  puts e.backtrace.first(5)
end
