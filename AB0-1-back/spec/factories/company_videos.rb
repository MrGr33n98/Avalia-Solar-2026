FactoryBot.define do
  factory :company_video do
    association :company
    url { 'https://www.youtube.com/watch?v=abc123' }
    provider { 'youtube' }
    video_id { 'abc123' }
    thumbnail_url { 'https://img.youtube.com/vi/abc123/hqdefault.jpg' }
    status { 'published' }
  end
end
