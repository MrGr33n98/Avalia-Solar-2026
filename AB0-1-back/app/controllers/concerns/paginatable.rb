# frozen_string_literal: true

# Paginatable concern - TASK-021
# Provides pagination helpers for API controllers
module Paginatable
  extend ActiveSupport::Concern

  # Default pagination settings
  DEFAULT_PAGE = 1
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  included do
    # Add pagination metadata to response headers
    before_action :set_pagination_headers, only: [:index]
  end

  private

  # Get pagination parameters from request
  def pagination_params
    {
      page: page_param,
      per_page: per_page_param
    }
  end

  # Get page number from params
  def page_param
    page = params[:page].to_i
    page.positive? ? page : DEFAULT_PAGE
  end

  # Get per_page from params (with max limit)
  def per_page_param
    per_page = params[:per_page].to_i
    return DEFAULT_PER_PAGE if per_page <= 0
    
    [per_page, MAX_PER_PAGE].min
  end

  # Paginate a collection
  def paginate(collection)
    collection.page(page_param).per(per_page_param)
  end

  # Add pagination metadata to response headers
  def set_pagination_headers
    return unless @pagy || @collection&.respond_to?(:current_page)

    collection = @pagy ? @pagy : @collection

    headers['X-Page'] = collection.current_page.to_s
    headers['X-Per-Page'] = collection.limit_value.to_s
    headers['X-Total'] = collection.total_count.to_s
    headers['X-Total-Pages'] = collection.total_pages.to_s
    
    # Link header for API navigation
    links = []
    base_url = request.base_url + request.path
    
    # First page
    links << %(<#{base_url}?page=1&per_page=#{collection.limit_value}>; rel="first")
    
    # Previous page
    if collection.prev_page
      links << %(<#{base_url}?page=#{collection.prev_page}&per_page=#{collection.limit_value}>; rel="prev")
    end
    
    # Next page
    if collection.next_page
      links << %(<#{base_url}?page=#{collection.next_page}&per_page=#{collection.limit_value}>; rel="next")
    end
    
    # Last page
    links << %(<#{base_url}?page=#{collection.total_pages}&per_page=#{collection.limit_value}>; rel="last")
    
    headers['Link'] = links.join(', ') if links.any?
  end

  # Pagination metadata for JSON response
  def pagination_metadata(collection)
    {
      page: collection.current_page,
      per_page: collection.limit_value,
      total: collection.total_count,
      total_pages: collection.total_pages,
      first_page: collection.current_page == 1,
      last_page: collection.current_page == collection.total_pages,
      prev_page: collection.prev_page,
      next_page: collection.next_page
    }
  end

  # Render paginated JSON response
  def render_paginated(collection, serializer: nil, **options)
    paginated = paginate(collection)
    @collection = paginated
    
    response_data = {
      data: serializer ? paginated.map { |item| serializer.new(item) } : paginated,
      meta: {
        pagination: pagination_metadata(paginated)
      }
    }
    
    render json: response_data, **options
  end
end
