import { intentSyncApi } from './intent-sync';
import { fetchApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));

const fetchMock = fetchApi as jest.Mock;

describe('Intent Sync tenant-aware API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({});
  });

  it('passes company ID explicitly on availability and audiences', async () => {
    await intentSyncApi.status(372);
    await intentSyncApi.audiences(372, 2);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1, '/demand_activation/status',
      expect.objectContaining({ params: { company_id: 372 } })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2, '/demand_activation/audiences',
      expect.objectContaining({ params: { company_id: 372, page: 2 } })
    );
  });

  it('never references internal Sales CRM endpoints', async () => {
    await intentSyncApi.createAudience(1190, { name: 'Comercial SC', filter_definition: { region: 'SC' } });
    expect(fetchMock).toHaveBeenCalledWith(
      '/demand_activation/audiences',
      expect.objectContaining({
        method: 'POST',
        params: { company_id: 1190 },
        body: { audience: { name: 'Comercial SC', filter_definition: { region: 'SC' } } },
      })
    );
  });

  it('sends source attestation metadata rather than contact uploads', async () => {
    const source = {
      name: 'Base própria',
      provenance: { purpose: 'Marketing', legal_basis: 'consent', attestation_version: 'v1' },
    };
    await intentSyncApi.registerSource(372, source);
    expect(fetchMock).toHaveBeenCalledWith(
      '/demand_activation/sources',
      expect.objectContaining({ method: 'POST', params: { company_id: 372 }, body: { source } })
    );
  });

  it('loads history via company-scoped endpoints', async () => {
    await intentSyncApi.history(372);
    await intentSyncApi.audit(372);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1, '/demand_activation/syncs', expect.objectContaining({ params: { company_id: 372 } })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2, '/demand_activation/audit', expect.objectContaining({ params: { company_id: 372 } })
    );
  });
});
