import { NextResponse } from 'next/server';

type WebVitalPayload = {
  name?: string;
  value?: number;
  rating?: string;
  id?: string;
  navigationType?: string;
  url?: string;
  pageTemplate?: string;
  normalizedPath?: string;
  deviceClass?: string;
  timestamp?: number;
};

export async function POST(request: Request) {
  let payload: WebVitalPayload = {};

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid JSON payload' }, { status: 400 });
  }

  // Web vitals are currently tracked via the frontend Mixpanel/PostHog integration in `track()`
  // We accept the payload here to satisfy the beacon/fetch request without throwing 502s
  // since the backend /api/v1/analytics/track endpoint is deprecated or unimplemented for vitals.
  return NextResponse.json({ status: 'success', message: 'Web vitals received' }, { status: 202 });
}
