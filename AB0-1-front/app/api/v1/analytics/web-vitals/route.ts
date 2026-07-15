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

  const proxyUrl = new URL('/api/v1/analytics/track', request.url);

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        event_type: 'web_vital',
        metadata: {
          metric_name: payload.name ?? null,
          metric_value: payload.value ?? null,
          metric_rating: payload.rating ?? null,
          metric_id: payload.id ?? null,
          navigation_type: payload.navigationType ?? null,
          page_url: payload.url ?? null,
          page_template: payload.pageTemplate ?? null,
          normalized_path: payload.normalizedPath ?? null,
          device_class: payload.deviceClass ?? null,
          timestamp: payload.timestamp ?? Date.now(),
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to forward web vitals event' },
        { status: 502 }
      );
    }

    return NextResponse.json({ status: 'success' }, { status: 202 });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Web vitals proxy unavailable' },
      { status: 502 }
    );
  }
}
