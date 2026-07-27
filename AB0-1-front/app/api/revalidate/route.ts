import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.NEXT_REVALIDATE_SECRET;
  const authorization = request.headers.get('authorization');

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { paths?: unknown; tags?: unknown } | null;
  const payload = body ?? {};
  const paths = Array.isArray(payload.paths) ? payload.paths.filter((path): path is string => typeof path === 'string' && /^\/companies\//.test(path)) : [];
  const tags = Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === 'string' && /^company(?:-|$)/.test(tag)) : [];

  if (paths.length === 0 && tags.length === 0) {
    return NextResponse.json({ error: 'No valid invalidation target' }, { status: 422 });
  }

  paths.forEach((path) => revalidatePath(path));
  tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({ revalidated: true, paths, tags });
}
