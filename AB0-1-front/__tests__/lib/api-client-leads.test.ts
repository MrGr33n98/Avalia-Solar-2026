import { leadsWizardApi } from '../../lib/api-client';

// Mock global fetch
global.fetch = jest.fn();

describe('leadsWizardApi.verifyEmailCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates code format before calling backend', async () => {
    await expect(leadsWizardApi.verifyEmailCode(10, 'abc'))
      .rejects
      .toThrow('Codigo de verificacao invalido');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws when backend returns 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Lead not found' }),
    });

    await expect(leadsWizardApi.verifyEmailCode(999, '123456'))
      .rejects
      .toThrow('[404]');
  });

  it('returns data when backend returns 200', async () => {
    const mockData = { companies: [{ id: 1, name: 'Test Company' }] };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await leadsWizardApi.verifyEmailCode(1, '123456');
    expect(result).toEqual(mockData);
  });
});

