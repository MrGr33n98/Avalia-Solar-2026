class ReviewNotifier < Noticed::Event
  deliver_by :database
end
