# frozen_string_literal: true

module Sales
  module Tracking
    class ScriptRenderer
      def initialize(api_root:, public_key:)
        @api_root = api_root
        @public_key = public_key
      end

      def call
        root = "#{@api_root}/api/v1/public/sales/tracking/".to_json
        <<~JAVASCRIPT
          (() => {
            const key = #{@public_key.to_json};
            const root = #{root};
            #{session_bootstrap}
            #{track_function}
            window.avaliaTrack = track;
            track('page_view');
            document.addEventListener('submit', (event) => {
              if (event.target instanceof HTMLFormElement) track('form_submitted');
            }, true);
          })();
        JAVASCRIPT
      end

      private

      def session_bootstrap
        <<~JAVASCRIPT
          const storageKey = `avalia:tracking:${key}`;
          const eventId = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, (char) => {
              const random = Math.random() * 16 | 0;
              return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
            });
          const post = (path, body) => fetch(`${root}${key}/${path}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true
          });
          const query = new URLSearchParams(location.search);
          const sessionId = sessionStorage.getItem(storageKey);
          const start = sessionId ? Promise.resolve(sessionId) : post('sessions', { session: {
            landing_path: location.pathname,
            referrer: (() => { try { return new URL(document.referrer).origin; } catch { return ''; } })(),
            utm_source: query.get('utm_source'), utm_medium: query.get('utm_medium'),
            utm_campaign: query.get('utm_campaign')
          }}).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
            sessionStorage.setItem(storageKey, data.session_id); return data.session_id;
          });
        JAVASCRIPT
      end

      def track_function
        <<~JAVASCRIPT
          const track = (name, properties = {}) => start.then((id) => post('events', {
            event: { session_id: id, event_uuid: eventId(), event_name: name,
              path: location.pathname, properties }
          })).then((response) => response.ok).catch(() => false);
        JAVASCRIPT
      end
    end
  end
end
