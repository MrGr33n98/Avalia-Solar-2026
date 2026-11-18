import { fetchApi } from '@/lib/api';
import {
  fetchReviewerProjects,
  fetchReviewerProjectSummary,
  createReviewerProject,
  updateReviewerProject,
  deleteReviewerProject,
} from './reviewer-portfolio-projects';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe('Reviewer Portfolio Projects API Client (PR6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchReviewerProjects calls endpoint with correct query string', async () => {
    mockFetchApi.mockResolvedValueOnce({ data: [], meta: { total: 0, limit: 20, offset: 0 } });

    await fetchReviewerProjects({ status: 'active', project_type: 'commercial', limit: 10 });

    expect(mockFetchApi).toHaveBeenCalledWith(
      '/reviewer/portfolio_projects?status=active&project_type=commercial&limit=10'
    );
  });

  it('fetchReviewerProjectSummary calls /summary', async () => {
    mockFetchApi.mockResolvedValueOnce({
      data: {
        total_projects: 3,
        total_capacity_kwp: 25.5,
        verified_projects: 1,
        public_projects: 2,
        by_type: {},
      },
    });

    const res = await fetchReviewerProjectSummary();

    expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/portfolio_projects/summary');
    expect(res.data.total_projects).toBe(3);
    expect(res.data.total_capacity_kwp).toBe(25.5);
  });

  it('createReviewerProject sends project and brand_usage_ids payload', async () => {
    mockFetchApi.mockResolvedValueOnce({ data: { id: '123' } });

    await createReviewerProject({
      title: 'Usina Solar 75kWp',
      project_type: 'rural',
      capacity_kwp: 75,
      brand_usage_ids: ['b1', 'b2'],
    });

    expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/portfolio_projects', {
      method: 'POST',
      body: JSON.stringify({
        project: {
          title: 'Usina Solar 75kWp',
          project_type: 'rural',
          capacity_kwp: 75,
        },
        brand_usage_ids: ['b1', 'b2'],
        consent_confirmed: undefined,
        consent_version: undefined,
      }),
    });
  });

  it('deleteReviewerProject calls DELETE on project id', async () => {
    mockFetchApi.mockResolvedValueOnce(undefined);

    await deleteReviewerProject('proj-99');

    expect(mockFetchApi).toHaveBeenCalledWith('/reviewer/portfolio_projects/proj-99', {
      method: 'DELETE',
    });
  });
});
