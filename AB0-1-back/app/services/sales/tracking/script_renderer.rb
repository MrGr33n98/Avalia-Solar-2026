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
            if (window.avaliaTrack && window.avaliaTrack.version === '2.0') return;

            const key = #{@public_key.to_json};
            const root = #{root};
            const storageKey = `avalia:tracking:${key}`;

            let inMemorySessionId = null;
            let inMemoryConsent = null;
            const eventQueue = [];
            let flushingEvents = false;

            const eventId = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
            }));

            const post = (path, body) => {
              try {
                return fetch(`${root}${key}/${path}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                  keepalive: true
                });
              } catch (e) {
                return Promise.reject(e);
              }
            };

            const getPartnerConsent = () => {
              if (inMemoryConsent !== null) return inMemoryConsent;

              const currentScript = document.currentScript || document.querySelector(`script[src*="${key}.js"]`);
              if (currentScript) {
                const explicitConsent = currentScript.getAttribute('data-consent');
                if (explicitConsent === 'granted') return true;
                if (explicitConsent === 'denied') return false;
              }

              if (typeof window.avaliaConsent !== 'undefined') {
                if (window.avaliaConsent === true) return true;
                if (typeof window.avaliaConsent === 'object' && window.avaliaConsent !== null) {
                  if (window.avaliaConsent.analytics === true) return true;
                  if (window.avaliaConsent.analytics === false) return false;
                }
                if (window.avaliaConsent === false) return false;
              }

              try {
                if (window.google_tag_data && window.google_tag_data.ics && window.google_tag_data.ics.entries) {
                  const entry = window.google_tag_data.ics.entries.analytics_storage;
                  if (entry && entry.status === 'granted') return true;
                  if (entry && entry.status === 'denied') return false;
                }
              } catch (_) {}

              return null;
            };

            const cleanClickIdFromUrl = () => {
              try {
                const url = new URL(location.href);
                if (url.searchParams.has('as_click_id')) {
                  url.searchParams.delete('as_click_id');
                  window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + url.hash);
                }
              } catch (_) {}
            };

            const initialUrl = new URL(location.href);
            let pendingClickId = initialUrl.searchParams.get('as_click_id');
            if (pendingClickId) cleanClickIdFromUrl();

            const startSession = (clickId, consentGranted) => {
              const resolvedClickId = clickId || pendingClickId;
              if (inMemorySessionId && !resolvedClickId) return Promise.resolve(inMemorySessionId);

              if (!resolvedClickId) {
                try {
                  const stored = sessionStorage.getItem(storageKey);
                  if (stored) {
                    inMemorySessionId = stored;
                    return Promise.resolve(stored);
                  }
                } catch (_) {}
              }

              const query = new URLSearchParams(location.search);

              return post('sessions', {
                session: {
                  landing_path: location.pathname,
                  referrer: (() => { try { return new URL(document.referrer).origin; } catch (_) { return ''; } })(),
                  utm_source: query.get('utm_source'),
                  utm_medium: query.get('utm_medium'),
                  utm_campaign: query.get('utm_campaign'),
                  as_click_id: resolvedClickId || undefined,
                  consent_state: consentGranted ? 'granted' : 'unknown'
                }
              }).then((res) => {
                if (!res.ok) return Promise.reject(new Error('Session init failed'));
                return res.json();
              }).then((data) => {
                inMemorySessionId = data.session_id;
                if (consentGranted) {
                  try { sessionStorage.setItem(storageKey, data.session_id); } catch (_) {}
                }
                pendingClickId = null;
                cleanClickIdFromUrl();
                return data.session_id;
              }).catch(() => null);
            };

            const flushQueue = (sessionId) => {
              if (flushingEvents) return Promise.resolve(false);
              flushingEvents = true;
              const sendNext = () => {
                if (eventQueue.length === 0) {
                  flushingEvents = false;
                  return Promise.resolve(true);
                }
                const item = eventQueue[0];
                return post('events', {
                  event: {
                    session_id: item.sessionId || sessionId,
                    event_uuid: item.uuid,
                    event_name: item.name,
                    path: item.path,
                    properties: item.properties
                  }
                }).then((res) => {
                  if (!res.ok) throw new Error('Event delivery failed');
                  eventQueue.shift();
                  return sendNext();
                }).catch(() => {
                  flushingEvents = false;
                  return false;
                });
              };
              return sendNext();
            };

            const track = (name, properties = {}) => {
              const consent = getPartnerConsent();

              if (consent === false && name !== 'consent_revoked') return Promise.resolve(false);

              if (consent !== true && name !== 'consent_granted') return Promise.resolve(false);

              return startSession(null, true).then((sessionId) => {
                if (!sessionId) return false;
                if (eventQueue.length >= 100) return false;
                eventQueue.push({
                  uuid: eventId(),
                  sessionId,
                  name,
                  path: location.pathname,
                  properties: typeof properties === 'object' && properties !== null ? properties : {}
                });
                return flushQueue(sessionId);
              });
            };

            const grantConsent = (options) => {
              inMemoryConsent = true;
              return startSession(pendingClickId, true).then((sessionId) => {
                if (sessionId) {
                  eventQueue.push({
                    uuid: eventId(),
                    sessionId,
                    name: 'consent_granted',
                    path: location.pathname,
                    properties: { source: options && options.source ? String(options.source) : 'cmp' }
                  });
                  return flushQueue(sessionId);
                }
                return true;
              });
            };

            const revokeConsent = () => {
              inMemoryConsent = false;
              const sessionId = inMemorySessionId;
              inMemorySessionId = null;
              eventQueue.length = 0;
              pendingClickId = null;

              try { sessionStorage.removeItem(storageKey); } catch (_) {}

              if (sessionId) {
                post('events', {
                  event: {
                    session_id: sessionId,
                    event_uuid: eventId(),
                    event_name: 'consent_revoked',
                    path: location.pathname,
                    properties: {}
                  }
                }).catch(() => {});
              }
              return true;
            };

            track.version = '2.0';
            track.grantConsent = grantConsent;
            track.revokeConsent = revokeConsent;
            track.hasConsent = () => inMemoryConsent === true || getPartnerConsent() === true;
            track.getSessionId = () => inMemorySessionId;

            window.avaliaTrack = track;

            track('page_view');

            document.addEventListener('submit', (event) => {
              try {
                if (event.target instanceof HTMLFormElement) {
                  const form = event.target;
                  const formId = (form.id || form.getAttribute('name') || '').slice(0, 100);
                  if (formId) {
                    track('form_submitted', { form_id: formId });
                  } else {
                    track('form_submitted');
                  }
                }
              } catch (_) {}
            }, true);
          })();
        JAVASCRIPT
      end
    end
  end
end
