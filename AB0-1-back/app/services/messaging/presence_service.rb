# frozen_string_literal: true

module Messaging
  class PresenceService
    class << self
      TTL = 3.minutes.to_i

      def touch(user_type, user_id)
        key = presence_key(user_type, user_id)
        Rails.cache.write(key, Time.current.to_i, expires_in: TTL)
        
        broadcast_status(user_type, user_id, 'online')
      end

      def mark_offline(user_type, user_id)
        key = presence_key(user_type, user_id)
        Rails.cache.delete(key)
        
        broadcast_status(user_type, user_id, 'offline')
      end

      def status(user_type, user_id)
        last_seen = Rails.cache.read(presence_key(user_type, user_id))
        return 'offline' unless last_seen

        time_diff = Time.current.to_i - last_seen
        if time_diff < 1.minute.to_i
          'online'
        elsif time_diff < TTL
          'away'
        else
          'offline'
        end
      end

      def last_seen_at(user_type, user_id)
        timestamp = Rails.cache.read(presence_key(user_type, user_id))
        timestamp ? Time.zone.at(timestamp) : nil
      end

      private

      def presence_key(user_type, user_id)
        "presence:#{user_type.to_s.downcase}:#{user_id}"
      end
      
      def broadcast_status(user_type, user_id, current_status)
        payload = { status: current_status, user_id: user_id, user_type: user_type, last_seen_at: Time.current }
        ActionCable.server.broadcast("presence:#{user_type.to_s.downcase}:#{user_id}", payload)

        if user_type.to_s == 'Lead' || user_type.to_s == 'User'
          # This is simple for MVP: just let clients rely on polling for list views, 
          # but for realtime chat we could broadcast to the inbox stream.
          # We'll broadcast a global event to the Inbox stream if the user is a Lead.
          if user_type.to_s == 'Lead'
            lead = Lead.find_by(id: user_id)
            if lead && lead.company_id
              ActionCable.server.broadcast("inbox:company:#{lead.company_id}", {
                type: 'inbox.presence.updated',
                user_type: user_type,
                user_id: user_id,
                status: current_status
              })
            end
          end
        end
      end
    end
  end
end
