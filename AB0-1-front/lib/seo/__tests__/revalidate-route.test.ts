import type { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { POST } from '@/app/api/revalidate/route';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

function buildMockRequest(options: {
  authorization?: string;
  body?: unknown;
}): NextRequest {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? (options.authorization ?? null) : null,
    },
    json: async () => options.body,
  } as unknown as NextRequest;
}

describe('POST /api/revalidate Category Allowlist & Security (J22-J24 / CDSI-106)', () => {
  const originalEnv = process.env.NEXT_REVALIDATE_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_REVALIDATE_SECRET = 'test-revalidate-secret-2026';
  });

  afterAll(() => {
    process.env.NEXT_REVALIDATE_SECRET = originalEnv;
  });

  it('J22: rejects unauthorized requests with 401', async () => {
    const req = buildMockRequest({
      authorization: 'Bearer wrong-token',
      body: { paths: ['/categories/inversores-solares'] },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('J23: returns 422 when paths and tags do not match allowlist', async () => {
    const req = buildMockRequest({
      authorization: 'Bearer test-revalidate-secret-2026',
      body: {
        paths: ['/admin/secret', '/categories/../../etc/passwd'],
        tags: ['unknown-tag', 'category-UPPERCASE'],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('J24: accepts category paths, sitemap paths, and category tags and triggers next/cache invalidation', async () => {
    const req = buildMockRequest({
      authorization: 'Bearer test-revalidate-secret-2026',
      body: {
        paths: [
          '/categories',
          '/categories/inversores-solares',
          '/categories/inversores-solares/solutions',
          '/sitemap.xml',
          '/sitemaps/categories/sitemap.xml',
        ],
        tags: ['categories', 'category-inversores-solares', 'category-solution-types'],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      revalidated: true,
      paths: [
        '/categories',
        '/categories/inversores-solares',
        '/categories/inversores-solares/solutions',
        '/sitemap.xml',
        '/sitemaps/categories/sitemap.xml',
      ],
      tags: ['categories', 'category-inversores-solares', 'category-solution-types'],
    });
    expect(revalidatePath).toHaveBeenCalledTimes(5);
    expect(revalidateTag).toHaveBeenCalledTimes(3);
  });
});
