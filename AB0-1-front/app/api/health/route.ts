import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    release: process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

