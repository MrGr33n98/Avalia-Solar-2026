# frozen_string_literal: true

class AdvertisingChannel < ApplicationCable::Channel
  def subscribed
    stream_from "advertising_channel"
  end

  def unsubscribed
    # Any cleanup can go here
  end
end
