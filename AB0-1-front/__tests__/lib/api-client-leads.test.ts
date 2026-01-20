import { leadsWizardApi } from '../../lib/api-client';

// Mock global fetch
global.fetch = jest.fn();

describe('leadsWizardApi.verifyOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when backend returns 404 (Lead not found)', async () => {
    // Simulate 404 Not Found response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Lead not found' }),
    });

    // We expect verifyOtp to throw an error now, instead of returning null
    // because returning null causes "response.companies" crash in UI
    await expect(leadsWizardApi.verifyOtp(999, '123456'))
      .rejects
      .toThrow('Lead não encontrado ou erro de comunicação.');
  });

  it('should return data when backend returns 200', async () => {
    const mockData = { companies: [{ id: 1, name: 'Test Company' }] };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await leadsWizardApi.verifyOtp(1, '123456');
    expect(result).toEqual(mockData);
  });
});