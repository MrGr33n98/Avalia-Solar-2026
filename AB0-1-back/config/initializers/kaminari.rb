# frozen_string_literal: true

# Kaminari configuration - TASK-021
# Pagination settings
# https://github.com/kaminari/kaminari

Kaminari.configure do |config|
  # Default items per page
  config.default_per_page = 25
  
  # Maximum items per page (prevent abuse)
  config.max_per_page = 100
  
  # Maximum pages to paginate
  # config.max_pages = nil
  
  # Window size for pagination links
  # e.g., < 1 [2] 3 4 5 [6] 7 8 9 10 >
  config.window = 4
  
  # Outer window size
  # e.g., [1] 2 ... 8 9 [10] 11 12 ... 99 [100]
  config.outer_window = 1
  
  # Left side of window
  # config.left = 0
  
  # Right side of window
  # config.right = 0
  
  # Parameter name for page number
  config.page_method_name = :page
  
  # Parameter name for per_page
  config.param_name = :page
  
  # Additional query string params to preserve
  # config.params_on_first_page = false
end
