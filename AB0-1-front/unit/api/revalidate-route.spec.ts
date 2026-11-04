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

function createRequest(payload: unknown, authorization = 'Bearer test-secret') {
  return {
    headers: new Headers({ authorization }),
    json: async () => payload,
  } as never;
}

describe('POST /api/revalidate', () => {
  const originalSecret = process.env.NEXT_REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.NEXT_REVALIDATE_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.NEXT_REVALIDATE_SECRET;
    else process.env.NEXT_REVALIDATE_SECRET = originalSecret;
  });

  it('requires the configured bearer secret', async () => {
    const response = await POST(
      createRequest({ paths: ['/blog/plano-founder-avalia-solar'] }, 'Bearer wrong')
    );

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('invalidates safe blog paths and article tags while rejecting unrelated targets', async () => {
    const response = await POST(
      createRequest({
        paths: ['/blog/plano-founder-avalia-solar', '/api/health', '/blog/../admin'],
        tags: ['articles', 'article-plano-founder-avalia-solar', 'secrets'],
      })
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/blog/plano-founder-avalia-solar');
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith('articles');
    expect(revalidateTag).toHaveBeenCalledWith('article-plano-founder-avalia-solar');
  });
});
