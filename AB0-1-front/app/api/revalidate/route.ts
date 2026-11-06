import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/categories$/,
  /^\/categories\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/(?:solutions|compare|matching))?$/,
  /^\/companies\/[a-z0-9-]+$/,
  /^\/blog\/[a-z0-9-]+$/,
  /^\/sitemap\.xml$/,
  /^\/sitemaps\/categories\/sitemap\.xml$/,
];

const ALLOWED_TAG_PATTERNS: RegExp[] = [
  /^(?:company|home|banner)(?:-[a-z0-9-]+)?$/,
  /^articles$/,
  /^article-[a-z0-9-]+$/,
  /^categories$/,
  /^category-[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^category-solution-types$/,
];

function isAllowedRevalidatePath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(path))
  );
}

function isAllowedRevalidateTag(tag: unknown): tag is string {
  return (
    typeof tag === 'string' &&
    ALLOWED_TAG_PATTERNS.some((pattern) => pattern.test(tag))
  );
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.NEXT_REVALIDATE_SECRET;
  const authorization = request.headers.get('authorization');

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    paths?: unknown;
    tags?: unknown;
  } | null;
  const payload = body ?? {};
  const paths = Array.isArray(payload.paths)
    ? payload.paths.filter(isAllowedRevalidatePath)
    : [];
  const tags = Array.isArray(payload.tags)
    ? payload.tags.filter(isAllowedRevalidateTag)
    : [];

  if (paths.length === 0 && tags.length === 0) {
    return NextResponse.json({ error: 'No valid invalidation target' }, { status: 422 });
  }

  paths.forEach((path) => revalidatePath(path));
  tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({ revalidated: true, paths, tags });
}
